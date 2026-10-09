// Lyrics & Chords: confirm a parsed song still holds the lyrics of its source.
// Usage: node scripts/parse.mjs song.txt | node scripts/check.mjs --original song.txt
// Reads the parsed JSON on standard input and the original text from --original.
// Prints a JSON result on standard output; a one-line summary goes to standard error.
// Exit codes: 0 lyrics match; 1 they do not; 2 bad option or unreadable input.
import { readFileSync } from "node:fs";
import { CHORD } from "./chord-words.mjs";
import { norm, songLyrics, originalLines, matchInOrder, parseLineList } from "./lyric-lines.mjs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/parse.mjs <song> | node scripts/check.mjs --original <song>

Checks that the lyric lines in the parsed song match the original text:
  - every lyric line of the song is found in the original, in order, unchanged;
  - no lyric line of the original is missing from the song;
  - every chord of the original is still in the song (counted, not placed).
Spacing is ignored: indentation, runs of spaces, trailing spaces and tabs, and a
non-breaking space all count as one ordinary space. Words, punctuation and every
other character are compared exactly. Nothing is corrected.

Options:
  --original FILE   The text the song was parsed from (required).
  --set-aside LIST  Original line numbers that were set aside on purpose because they are not
                    lyrics (a title, a credit line), for example 1,2. They are not reported as
                    missing and are listed in the output under "setAside".
  --help            Show this message.

Output: {"ok": true|false, "lyricLines": N, "problems": [ ... ]}
Each problem has a "kind":
  "changed"  a song line and an original line that are the same line with different words.
             Fields: line (original line number), originalText, lyricLine (song lyric
             line number), songText, onlyInOriginal (words), onlyInSong (words).
             Also extraBefore or extraAfter when the original line is the song line with
             extra text in front of it or behind it (page clutter, for example).
  "missing"  an original line with no counterpart in the song (and not a header, chord
             or fact line). Fields: line, text.
  "extra"    a song line with no counterpart in the original. Fields: lyricLine, text.
  "chords-missing"  a chord that appears more often in the original than in the song.
             Fields: chord, inOriginal, inSong, lines (original line numbers).

Exit codes: 0 match; 1 mismatch; 2 bad option or unreadable input.`);
  process.exit(0);
}

const at = args.indexOf("--original");
if (at < 0 || !args[at + 1]) {
  console.error("Error: --original FILE is required. Example: --original song.txt (see --help).");
  process.exit(2);
}

let setAsideLines = null;
if (args.includes("--set-aside")) {
  setAsideLines = parseLineList(args[args.indexOf("--set-aside") + 1]);
  if (!setAsideLines) {
    console.error(`Error: --set-aside must be line numbers such as 1,2 or 1-3,7. Received: "${args[args.indexOf("--set-aside") + 1]}"`);
    process.exit(2);
  }
}

let original, song;
try {
  original = readFileSync(args[at + 1], "utf8");
} catch (err) {
  console.error(`Error: cannot read the original "${args[at + 1]}": ${err.message}`);
  process.exit(2);
}
try {
  song = JSON.parse(readFileSync(0, "utf8"));
  if (song.type !== "chordSheet" || !Array.isArray(song.lines)) throw new Error("not parsed song JSON");
} catch (err) {
  console.error(`Error: standard input must be the JSON from parse.mjs (${err.message}).`);
  process.exit(2);
}

const MARK = /^(\||\|\||\/|x|-|N\.C\.|\(?[0-9]+x\)?|:\|\|?|\|:)$/;
const isChordLine = (s) => {
  const t = s.trim().split(/\s+/).filter(Boolean);
  return t.length > 0 && t.every((w) => CHORD.test(w) || MARK.test(w));
};

// Words in a and b that are not part of their longest common run of words, in order.
function wordDifference(a, b) {
  const x = a.split(" ").filter(Boolean);
  const y = b.split(" ").filter(Boolean);
  const table = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0));
  for (let i = x.length - 1; i >= 0; i--) {
    for (let j = y.length - 1; j >= 0; j--) {
      table[i][j] = x[i] === y[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const onlyInOriginal = [];
  const onlyInSong = [];
  let i = 0;
  let j = 0;
  while (i < x.length && j < y.length) {
    if (x[i] === y[j]) { i++; j++; }
    else if (table[i + 1][j] >= table[i][j + 1]) onlyInOriginal.push(x[i++]);
    else onlyInSong.push(y[j++]);
  }
  while (i < x.length) onlyInOriginal.push(x[i++]);
  while (j < y.length) onlyInSong.push(y[j++]);
  return { onlyInOriginal, onlyInSong };
}

// Lyric lines of the song, and the other text it holds (tag values).
const lyricObjects = songLyrics(song);
const lyrics = lyricObjects.map((l) => l.text);
const facts = [];
for (const line of song.lines) {
  for (const x of line.items) {
    if (x.type === "tag" && x.value) facts.push(norm(String(x.value)));
    if (x.type === "comment" && x.comment) facts.push(norm(x.comment.trim()));
  }
}

const origLines = originalLines(original);
const { matchedAt, unmatched: unmatchedSong } = matchInOrder(lyricObjects, origLines);
const matchedOriginal = new Set(matchedAt.values());

// Lines the caller set aside on purpose (a title, a credit line): not lyrics, so not "missing".
const setAside = new Set(setAsideLines || []);

const accounted = (o) => {
  const t = o.text.trim();
  if (!t) return true;
  if (setAside.has(o.n)) return true;
  if (/^\{.*\}$/.test(t) || t.startsWith("#")) return true;
  if (/^\[[^\]]*\]$/.test(o.raw.trim())) return true;
  if (isChordLine(o.raw)) return true;
  const escape = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return facts.some((f) => {
    const v = f && f.trim();
    return v && (t === v || new RegExp(`^[A-Za-z][A-Za-z ]*:\\s*${escape(v)}$`).test(t));
  });
};
// Chords: every chord in the original should still be in the song.
const chordsIn = (text) => {
  const counts = new Map();
  const add = (token, line) => {
    if (!CHORD.test(token)) return;
    if (!counts.has(token)) counts.set(token, { count: 0, lines: [] });
    const c = counts.get(token);
    c.count++;
    if (!c.lines.includes(line)) c.lines.push(line);
  };
  text.split("\n").forEach((raw, i) => {
    for (const m of raw.matchAll(/\[([^\]\n]*)\]/g)) m[1].split(/\s+/).filter(Boolean).forEach((t) => add(t, i + 1));
    if (isChordLine(raw) && !raw.includes("[")) raw.trim().split(/\s+/).forEach((t) => add(t, i + 1));
  });
  return counts;
};
const originalChords = chordsIn(original.replace(/\r\n?/g, "\n"));
const songChords = new Map();
for (const line of song.lines) {
  for (const x of line.items) {
    if (x.type !== "chordLyricsPair" || !x.chords) continue;
    for (const t of x.chords.trim().split(/\s+/).filter(Boolean)) if (CHORD.test(t)) songChords.set(t, (songChords.get(t) || 0) + 1);
  }
}

const droppedOriginal = origLines.map((_, k) => k).filter((k) => !matchedOriginal.has(k) && !accounted(origLines[k]));

// Pair unmatched song lines with dropped original lines that sit in the same gap.
const groups = new Map();
for (const s of unmatchedSong) {
  let prev = -1;
  let next = origLines.length;
  for (const [i, k] of matchedAt) {
    if (i < s) prev = Math.max(prev, k);
    else next = Math.min(next, k);
  }
  const key = `${prev}:${next}`;
  if (!groups.has(key)) groups.set(key, { prev, next, songs: [] });
  groups.get(key).songs.push(s);
}

const found = []; // [position, problem]
const usedOriginal = new Set();
for (const g of groups.values()) {
  const candidates = droppedOriginal.filter((k) => k > g.prev && k < g.next);
  g.songs.forEach((s, i) => {
    if (i < candidates.length) {
      const k = candidates[i];
      usedOriginal.add(k);
      const o = origLines[k];
      const problem = {
        kind: "changed",
        line: o.n,
        originalText: o.text,
        lyricLine: s + 1,
        songText: lyrics[s],
        ...wordDifference(o.text, lyrics[s]),
      };
      if (o.text.length > lyrics[s].length && o.text.endsWith(lyrics[s])) {
        problem.extraBefore = o.text.slice(0, o.text.length - lyrics[s].length).trim();
      } else if (o.text.length > lyrics[s].length && o.text.startsWith(lyrics[s])) {
        problem.extraAfter = o.text.slice(lyrics[s].length).trim();
      }
      found.push([k, problem]);
    } else {
      found.push([g.prev + 0.5, { kind: "extra", lyricLine: s + 1, text: lyrics[s] }]);
    }
  });
}
for (const k of droppedOriginal) {
  if (!usedOriginal.has(k)) found.push([k, { kind: "missing", line: origLines[k].n, text: origLines[k].text }]);
}
for (const [chord, { count, lines }] of originalChords) {
  const have = songChords.get(chord) || 0;
  if (have < count) found.push([lines[0] - 1, { kind: "chords-missing", chord, inOriginal: count, inSong: have, lines }]);
}
const problems = found.sort((a, b) => a[0] - b[0]).map((p) => p[1]);

const result = { ok: problems.length === 0, lyricLines: lyrics.length, problems };
if (setAsideLines) {
  const inSong = new Set([...matchedAt.values()].map((k) => origLines[k].n));
  result.setAside = setAsideLines.map((n) => ({
    line: n,
    text: origLines[n - 1] ? origLines[n - 1].text : "(past the end of the file)",
    stillInSong: inSong.has(n),
  }));
}
const count = (kind) => problems.filter((p) => p.kind === kind).length;
const summary = result.ok
  ? `check: ok (${lyrics.length} lyric lines match)`
  : `check: ${problems.length} problem(s): ${count("changed")} changed, ${count("missing")} missing, ${count("extra")} extra, ${count("chords-missing")} chord(s) lost (see output)`;
// Write everything out before exiting (a large result cut short would be unreadable), then the summary.
process.stdout.write(JSON.stringify(result, null, 2) + "\n", () => {
  console.error(summary);
  process.exit(result.ok ? 0 : 1);
});
