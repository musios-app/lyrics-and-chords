// Lyrics & Chords: load a song in one step.
// Usage: node scripts/load.mjs <file>                       (or "-" to read pasted text on standard input)
//        node scripts/load.mjs <file> --facts facts.json --set-aside 1,2 --as chordpro --output song.cho
// Runs the separate scripts in order: parse, set aside, add facts, check, write out.
// The separate scripts still work on their own; this one only chains them.
// Prints one JSON result on standard output. Exit codes: 0 loaded (status ok or needs-info);
// 1 failed (see "problems"); 2 bad option.
import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseLineList } from "./lyric-lines.mjs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/load.mjs <file | -> [options]

Loads a lyric or chord sheet: parse, set aside non-lyric lines, add song facts, check that the
lyrics and chords are intact, and optionally write the song out. "-" reads pasted text from
standard input.

Options:
  --facts FILE      JSON file of song facts (title, artist, lyricist, composer, date, ... see add-metadata.mjs).
  --set-aside LIST  Original line numbers that are not lyrics (a title, a credit line), such as 1,2.
  --format NAME     Force the reader: chordpro, chords-over-words or ultimate-guitar.
  --as NAME         Also write the song out: text, chordpro or chords-over-words.
  --output FILE     With --as, save the written song to FILE instead of putting it in the result.
  --help            Show this message.

Result (JSON on standard output):
  status     "ok", "needs-info" (loaded, but a title, credits or date is missing) or "failed"
  missing    which of title, credits, date are not in the song (never copyright)
  questions  plain questions for the writer, one for each missing item
  problems   why it failed (parse or check problems), or empty
  notes      what the reader repaired or noticed
  setAside   the lines set aside, if any
  song       the loaded song (not given when status is "failed")
  output     the written song, when --as is given without --output

Exit codes: 0 loaded; 1 failed; 2 bad option.`);
  process.exit(0);
}

const here = fileURLToPath(new URL(".", import.meta.url));
const value = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
const flagsWithValue = ["--facts", "--set-aside", "--format", "--as", "--output"];
const positional = args.filter((a, i) => !a.startsWith("--") && !(i > 0 && flagsWithValue.includes(args[i - 1])));

if (positional.length !== 1) {
  console.error("Error: give one file to load, or - to read pasted text from standard input. See --help.");
  process.exit(2);
}
const asValue = value("--as");
if (asValue && !["text", "chordpro", "chords-over-words"].includes(asValue)) {
  console.error(`Error: --as must be text, chordpro or chords-over-words. Received: "${asValue}"`);
  process.exit(2);
}
if (value("--output") && !asValue) {
  console.error("Error: --output needs --as, to say what to write. See --help.");
  process.exit(2);
}
const setAsideList = value("--set-aside");
if (setAsideList && !parseLineList(setAsideList)) {
  console.error(`Error: --set-aside must be line numbers such as 1,2 or 1-3,7. Received: "${setAsideList}"`);
  process.exit(2);
}

// Pasted text goes to a temporary file, so every step reads the same original.
let original = positional[0];
let tempDir = null;
if (original === "-") {
  tempDir = mkdtempSync(join(tmpdir(), "lyrics-and-chords-"));
  original = join(tempDir, "pasted.txt");
  writeFileSync(original, readFileSync(0, "utf8"));
}

const run = (script, scriptArgs, input) =>
  spawnSync(process.execPath, [join(here, script), ...scriptArgs], { input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const lines = (text) => text.split("\n").map((l) => l.trim()).filter(Boolean);

class Stop extends Error {}
const result = { status: "failed", missing: [], questions: [], problems: [], notes: [], setAside: [] };
const finish = (code) => {
  if (tempDir) rmSync(tempDir, { recursive: true, force: true });
  const summary =
    result.status === "failed"
      ? `load: failed (${result.problems.length} problem(s), see output)`
      : `load: ${result.status}${result.missing.length ? ` (missing: ${result.missing.join(", ")})` : ""}`;
  // Write everything out before exiting (a large result cut short would be unreadable), then the summary.
  process.stdout.write(JSON.stringify(result, null, 2) + "\n", () => {
    console.error(summary);
    process.exit(code);
  });
  throw new Stop(); // nothing after finish() may run
};
const fail = (kind, message) => {
  result.problems.push({ kind, message });
  finish(1);
};

try {
  // 1. Read the sheet.
  const parsed = run("parse.mjs", [original, ...(value("--format") ? ["--format", value("--format")] : [])]);
  result.notes.push(...lines(parsed.stderr).filter((l) => l.startsWith("note:") || l.startsWith("format:")));
  if (parsed.status !== 0) fail("parse", parsed.stderr.trim());
  let song = parsed.stdout;

  // 2. Set aside lines that are not lyrics.
  if (setAsideList) {
    const aside = run("set-aside.mjs", ["--original", original, "--lines", setAsideList], song);
    if (aside.status !== 0) fail("set-aside", aside.stderr.trim());
    song = aside.stdout;
    result.setAside = lines(aside.stderr).filter((l) => l.startsWith("line ") || l.startsWith("  line ")).map((l) => l.replace(/^\s+/, ""));
  }

  // 3. Add the song facts.
  if (value("--facts")) {
    const facts = run("add-metadata.mjs", ["--meta", value("--facts")], song);
    if (facts.status !== 0) fail("facts", facts.stderr.trim());
    song = facts.stdout;
  }

  // 4. Check that the lyrics and chords are intact.
  const checked = run("check.mjs", ["--original", original, ...(setAsideList ? ["--set-aside", setAsideList] : [])], song);
  if (checked.status === 2 || !checked.stdout.trim()) fail("check", checked.stderr.trim());
  const checkResult = JSON.parse(checked.stdout);
  if (!checkResult.ok) {
    result.problems = checkResult.problems;
    finish(1);
  }

  // 5. Report what is missing. Copyright is never asked for.
  const songJson = JSON.parse(song);
  const tags = new Set(songJson.lines.flatMap((l) => l.items.filter((x) => x.type === "tag" && x.value).map((x) => x.name)));
  const wanted = [
    ["title", ["title"], "What is the title of the song?"],
    ["credits", ["artist", "lyricist", "composer"], "Who wrote or performs it (artist, lyricist or composer)?"],
    ["date", ["year", "date"], "When was it written or published?"],
  ];
  for (const [name, tagNames, question] of wanted) {
    if (!tagNames.some((t) => tags.has(t))) {
      result.missing.push(name);
      result.questions.push(question);
    }
  }
  result.status = result.missing.length ? "needs-info" : "ok";
  result.song = songJson;

  // 6. Write the song out, if asked.
  if (asValue) {
    const written = run("format.mjs", ["--as", asValue], song);
    if (written.status !== 0) fail("format", written.stderr.trim());
    if (value("--output")) {
      writeFileSync(value("--output"), written.stdout);
      result.notes.push(`wrote ${asValue} to ${value("--output")}`);
    } else {
      result.output = written.stdout;
    }
  }
  finish(0);
} catch (err) {
  if (!(err instanceof Stop)) throw err;
}
