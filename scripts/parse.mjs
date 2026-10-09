// Lyrics & Chords: read one well-formed sheet and print ChordSheetJS's own JSON.
// Usage: node scripts/parse.mjs <file>      (or pipe text in on standard input)
// Optional: --format chordpro | chords-over-words | ultimate-guitar
// The detected format goes to standard error; the JSON goes to standard output.
import { readFileSync } from "node:fs";
import {
  ChordProParser,
  ChordsOverWordsParser,
  UltimateGuitarParser,
  ChordSheetSerializer,
} from "chordsheetjs";

const args = process.argv.slice(2);
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
if (!parsers[format]) {
  console.error(`Unknown format "${format}". Use: ${Object.keys(parsers).join(", ")}`);
  process.exit(2);
}

try {
  const song = new parsers[format]().parse(text);
  console.error(`format: ${format}`);
  console.log(JSON.stringify(new ChordSheetSerializer().serialize(song), null, 2));
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
