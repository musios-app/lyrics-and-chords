// Lyrics & Chords: turn ChordSheetJS JSON (from parse.mjs) back into text.
// Usage: node scripts/parse.mjs song.txt | node scripts/format.mjs [--as text | chordpro | chords-over-words]
// Chord names are written exactly as they were read.
import { readFileSync } from "node:fs";
import {
  ChordSheetSerializer,
  TextFormatter,
  ChordProFormatter,
  ChordsOverWordsFormatter,
} from "chordsheetjs";

const args = process.argv.slice(2);
const as = args.includes("--as") ? args[args.indexOf("--as") + 1] : "text";
const formatters = {
  text: TextFormatter,
  chordpro: ChordProFormatter,
  "chords-over-words": ChordsOverWordsFormatter,
};
if (!formatters[as]) {
  console.error(`Unknown output "${as}". Use: ${Object.keys(formatters).join(", ")}`);
  process.exit(2);
}
try {
  const song = new ChordSheetSerializer().deserialize(JSON.parse(readFileSync(0, "utf8")));
  // The library rewrites chord names by default (maj7 becomes ma7, min7 becomes m7). Turn that off:
  // chords are written as they were read.
  const keepChords = { normalizeChords: false, normalizeChordSuffix: false };
  process.stdout.write(new formatters[as](keepChords).format(song) + "\n");
} catch (err) {
  console.error(`Could not format: ${err.message}`);
  process.exit(1);
}
