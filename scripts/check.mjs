// Lyrics & Chords: confirm a parsed song still holds the lyrics of its source.
// Usage: node scripts/parse.mjs song.txt | node scripts/check.mjs --original song.txt
// Reads the parsed JSON on standard input and the original text from --original.
// Prints a JSON result on standard output; a one-line summary goes to standard error.
// Exit codes: 0 lyrics match; 1 they do not; 2 bad option or unreadable input.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/parse.mjs <song> | node scripts/check.mjs --original <song>

Checks that the lyric lines in the parsed song match the original text:
  - every lyric line of the song is found in the original, in order, unchanged;
  - no lyric line of the original is missing from the song.
Spacing is ignored: indentation, runs of spaces, trailing spaces and tabs, and a
non-breaking space all count as one ordinary space. Words, punctuation and every
other character are compared exactly. Nothing is corrected.

Options:
  --original FILE   The text the song was parsed from (required).
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

Exit codes: 0 match; 1 mismatch; 2 bad option or unreadable input.`);
  process.exit(0);
}

const at = args.indexOf("--original");
if (at < 0 || !args[at + 1]) {
  console.error("Error: --original FILE is required. Example: --original song.txt (see --help).");
  process.exit(2);
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

const norm = (s) => s.replace(/\s+/g, " ").trim();
const CHORD = /^[A-G][#b]?(m|maj|min|dim|aug|sus|add|M)?[0-9]*(sus[24]?|add[0-9]+|maj[0-9]+)?(\/[A-G][#b]?)?$/;
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
const lyrics = [];
const facts = [];
for (const line of song.lines) {
  const pairs = line.items.filter((x) => x.type === "chordLyricsPair");
  const text = pairs.map((p) => p.lyrics).join("");
  if (pairs.length && text.trim()) lyrics.push(norm(text));
  for (const x of line.items) {
    if (x.type === "tag" && x.value) facts.push(norm(String(x.value)));
    if (x.type === "comment" && x.comment) facts.push(norm(x.comment.trim()));
  }
}

// Original lines with inline [chords] removed, as the song would hold them.
const origLines = original.replace(/\r\n?/g, "\n").split("\n").map((raw, i) => ({
  n: i + 1,
  raw,
  text: norm(raw.replace(/\[[^\]\n]*\]/g, "")),
}));

// Match each song lyric line to the next equal original line, in order.
const matchedAt = new Map(); // song lyric index -> original index
const matchedOriginal = new Set();
const unmatchedSong = [];
let cursor = 0;
for (const [index, lyric] of lyrics.entries()) {
  let found = -1;
  for (let k = cursor; k < origLines.length; k++) {
    if (origLines[k].text === lyric) { found = k; break; }
  }
  if (found < 0) {
    unmatchedSong.push(index);
  } else {
    matchedAt.set(index, found);
    matchedOriginal.add(found);
    cursor = found + 1;
  }
}

const accounted = (o) => {
  const t = o.text.trim();
  if (!t) return true;
  if (/^\{.*\}$/.test(t) || t.startsWith("#")) return true;
  if (/^\[[^\]]*\]$/.test(o.raw.trim())) return true;
  if (isChordLine(o.raw)) return true;
  return facts.some((f) => f && (t === f.trim() || t.includes(f.trim())));
};
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
const problems = found.sort((a, b) => a[0] - b[0]).map((p) => p[1]);

const result = { ok: problems.length === 0, lyricLines: lyrics.length, problems };
console.log(JSON.stringify(result, null, 2));
const count = (kind) => problems.filter((p) => p.kind === kind).length;
console.error(result.ok
  ? `check: ok (${lyrics.length} lyric lines match)`
  : `check: ${problems.length} problem(s): ${count("changed")} changed, ${count("missing")} missing, ${count("extra")} extra (see output)`);
process.exit(result.ok ? 0 : 1);
