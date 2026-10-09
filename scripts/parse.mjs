// Lyrics & Chords: read one well-formed sheet and print ChordSheetJS's own JSON.
// Usage: node scripts/parse.mjs <file>      (or pipe text in on standard input)
// Optional: --format chordpro | chords-over-words | ultimate-guitar | lyrics-only
// The detected format goes to standard error; the JSON goes to standard output.
import { readFileSync } from "node:fs";
import {
  ChordProParser,
  ChordsOverWordsParser,
  UltimateGuitarParser,
  ChordSheetSerializer,
} from "chordsheetjs";
import { CHORD } from "./chord-words.mjs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/parse.mjs <file>        (or pipe the text in on standard input)
       node scripts/parse.mjs --format chordpro | chords-over-words | ultimate-guitar | lyrics-only <file>

Reads one lyric or chord sheet and prints ChordSheetJS's JSON on standard output.
The format is picked from the text unless --format is given. Notes (the format picked, repairs made)
go to standard error.

lyrics-only is for text that has no chords at all (a page's lyrics): a line that is just [Something] is a
section header, every other line is a lyric, and no word is ever read as a chord. [Verse 1: Name] becomes
the section "Verse 1" plus a comment line holding the performer. Pages loaded by load.mjs use it.

Repairs made on the way: a line of two or more bracketed chords in an Ultimate Guitar style sheet is
read as a chord line; a section runs from its header to the next header, across blank lines; padding
spaces on chords are trimmed.

Exit codes: 0 done; 1 could not parse (the message gives the line, column and a hint); 2 unknown format.`);
  process.exit(0);
}
let forced = null;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--format") forced = args[++i];
  else files.push(args[i]);
}

const text = (files.length ? readFileSync(files[0], "utf8") : readFileSync(0, "utf8"))
  .replace(/^﻿/, "")
  .replace(/\r\n?/g, "\n");

function detect(t) {
  if (/^\s*\{\s*[a-z_]+\s*(:|\})/im.test(t)) return "chordpro";
  if (/\[[A-G][^\]\s]*\]/.test(t) && !/^\s*\[[^\]]+\]\s*$/m.test(t)) return "chordpro";
  if (/^\s*\[[^\]]+\]\s*$/m.test(t)) return "ultimate-guitar";
  return "chords-over-words";
}

const parsers = {
  chordpro: ChordProParser,
  "chords-over-words": ChordsOverWordsParser,
  "ultimate-guitar": UltimateGuitarParser,
};

const format = forced || detect(text);
if (!parsers[format] && format !== "lyrics-only") {
  console.error(`Unknown format "${format}". Use: ${[...Object.keys(parsers), "lyrics-only"].join(", ")}`);
  process.exit(2);
}

// The Ultimate Guitar reader takes a line of bracketed chords such as "[D] [Am] [G/D]" for a
// section header and drops the chords. Read such a line (two or more brackets, all chords)
// as a line of chords above words instead, keeping every chord in the same column.
function readBracketChordLines(t) {
  let changed = 0;
  const fixed = t.split("\n").map((line) => {
    const groups = line.match(/\[[^\]]*\]/g);
    if (!groups || groups.length < 2 || line.replace(/\[[^\]]*\]/g, "").trim()) return line;
    const allChords = groups.every((g) => g.slice(1, -1).trim().split(/\s+/).every((tok) => CHORD.test(tok)));
    if (!allChords) return line;
    changed++;
    return line.replace(/[\[\]]/g, " ");
  });
  return { text: fixed.join("\n"), changed };
}

let toParse = text;
if (format === "ultimate-guitar") {
  const { text: fixed, changed } = readBracketChordLines(text);
  toParse = fixed;
  if (changed) console.error(`note: ${changed} line(s) of bracketed chords were read as chords above words`);
}

// A section runs from its header to the next header, whatever blank lines lie between.
// Ultimate Guitar style: the reader ends a section at the first blank line, so a header
// followed by a blank line encloses nothing; its own end markers are replaced.
// ChordPro: only sections that are never closed are closed. Headers the reader keeps as
// comments (such as POST-CHORUS) become sections when they were headers in the original.
function restructureSections(lines, originalText, replaceEnds) {
  const headers = new Set(
    originalText.split("\n")
      .map((l) => (l.match(/^\s*\[([^\]]+)\]\s*$/) || [])[1])
      // In ChordPro a lone [C] is a chord; in Ultimate Guitar style chords have lines of their own, so a
      // lone [B] or [A] is a section header.
      .filter((h) => h && (replaceEnds || !h.trim().split(/\s+/).every((tok) => CHORD.test(tok))))
      .map((h) => h.trim().toLowerCase()),
  );
  const tag = (l) => (l.items.length === 1 && l.items[0].type === "tag" ? l.items[0] : null);
  const result = [];
  let open = null;
  let closed = 0;
  let promoted = 0;
  const close = () => {
    if (!open) return;
    let at = result.length;
    while (at > 0 && result[at - 1].items.length === 0) at--;
    result.splice(at, 0, { type: "line", items: [{ type: "tag", name: open.replace("start_of_", "end_of_"), value: "", attributes: {} }] });
    open = null;
  };
  for (const line of lines) {
    const t = tag(line);
    if (t && /^end_of_/.test(t.name)) {
      if (replaceEnds) continue;
      open = null;
    } else if (t && t.name === "comment" && headers.has(String(t.value).trim().toLowerCase())) {
      if (open) { close(); closed++; }
      promoted++;
      open = "start_of_part";
      result.push({ type: "line", items: [{ type: "tag", name: "start_of_part", value: t.value, attributes: {} }] });
      continue;
    } else if (t && /^start_of_/.test(t.name)) {
      if (open) { close(); closed++; }
      open = t.name;
    }
    result.push(line);
  }
  if (open) { close(); closed++; }
  return { lines: result, closed, promoted };
}

// The readers leave chords padded with the spaces of the chord line ("D  ", "      ").
// Trim them, and drop the items that are left with no chord and no lyric.
function tidyChords(lines) {
  let trimmed = 0;
  let dropped = 0;
  for (const line of lines) {
    for (const x of line.items) {
      if (x.type === "chordLyricsPair" && x.chords && x.chords.trim() !== x.chords) {
        x.chords = x.chords.trim();
        trimmed++;
      }
    }
    const kept = line.items.filter((x) => !(x.type === "chordLyricsPair" && !x.chords && !x.lyrics));
    dropped += line.items.length - kept.length;
    line.items = kept;
  }
  return { trimmed, dropped };
}

// Text with no chords: a line that is only [Something] opens a section, every other line is a lyric,
// and nothing is read as a chord. [Label: performers] gives the section "Label" and a comment holding
// the performers. Lines are kept exactly (a trailing carriage return is already gone).
function readLyricsOnly(t) {
  const tag = (name, value) => ({ type: "line", items: [{ type: "tag", name, value, attributes: {} }] });
  const lines = [];
  for (const raw of t.replace(/\n+$/, "").split("\n")) {
    const header = raw.match(/^\s*\[([^\]]+)\]\s*$/);
    if (header) {
      const inner = header[1].trim();
      const colon = inner.indexOf(":");
      const label = (colon > 0 ? inner.slice(0, colon) : inner).trim();
      const performers = colon > 0 ? inner.slice(colon + 1).trim() : "";
      const kind = /^verse/i.test(label) ? "verse" : /^chorus/i.test(label) ? "chorus" : /^bridge/i.test(label) ? "bridge" : "part";
      lines.push(tag(`start_of_${kind}`, label));
      if (performers) lines.push(tag("comment", performers));
    } else if (!raw.trim()) {
      lines.push({ type: "line", items: [] });
    } else {
      lines.push({ type: "line", items: [{ type: "chordLyricsPair", chords: "", chord: null, lyrics: raw, annotation: "" }] });
    }
  }
  return { type: "chordSheet", lines };
}

try {
  let json;
  if (format === "lyrics-only") {
    json = readLyricsOnly(text);
    json.lines = restructureSections(json.lines, "", false).lines;
    console.error(`format: ${format}`);
  } else {
    const song = new parsers[format]().parse(toParse);
    console.error(`format: ${format}`);
    json = new ChordSheetSerializer().serialize(song);
    const tidy = tidyChords(json.lines);
    if (tidy.trimmed || tidy.dropped) console.error(`note: padding removed from ${tidy.trimmed} chord(s); ${tidy.dropped} empty item(s) dropped`);
    if (format === "ultimate-guitar" || format === "chordpro") {
      const fixed = restructureSections(json.lines, text, format === "ultimate-guitar");
      json.lines = fixed.lines;
      if (fixed.promoted) console.error(`note: ${fixed.promoted} header(s) read as comments were made sections`);
    }
  }
  console.log(JSON.stringify(json, null, 2));
} catch (err) {
  console.error(explain(err));
  process.exit(1);
}

// A readable account of a parse failure: where it is, what was found and expected,
// the lines around it, and a hint when the mistake is probably on the line before.
function explain(err) {
  const where = err.location && err.location.start;
  if (!where) return `Could not parse as ${format}: ${err.message}`;
  const lines = text.split("\n");
  const found = err.found === null || err.found === undefined ? "the end of the text" : JSON.stringify(err.found);
  const wanted = [...new Set((err.expected || []).map((x) => (x.text !== undefined ? JSON.stringify(x.text) : x.description)))]
    .slice(0, 6)
    .join(" or ");
  const out = [
    `Could not parse as ${format}: the parser stopped at line ${where.line}, column ${where.column}.`,
    `It found ${found}${wanted ? ` and expected ${wanted}` : ""}.`,
  ];
  const first = Math.max(1, where.line - 1);
  const last = Math.min(lines.length, where.line);
  for (let n = first; n <= last; n++) out.push(`  line ${n}: ${lines[n - 1]}`);
  if (where.line <= lines.length) out.push(`  ${" ".repeat(`line ${where.line}: `.length + where.column - 1)}^`);
  const before = lines[where.line - 2] || "";
  for (const [open, close] of [["{", "}"], ["[", "]"]]) {
    if (before.split(open).length > before.split(close).length) {
      out.push(`Hint: line ${where.line - 1} opens "${open}" but does not close it with "${close}". The mistake is probably there.`);
    }
  }
  if (!forced) {
    const others = Object.keys(parsers).filter((f) => f !== format).join(" or ");
    out.push(`If ${format} is the wrong guess, run again with --format ${others}.`);
  }
  return out.join("\n");
}
