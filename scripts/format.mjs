// Lyrics & Chords: turn ChordSheetJS JSON (from parse.mjs) back into text.
// Usage: node scripts/parse.mjs song.txt | node scripts/format.mjs [--as text | chordpro | chords-over-words]
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
  process.stdout.write(new formatters[as]().format(song) + "\n");
} catch (err) {
  console.error(`Could not format: ${err.message}`);
  process.exit(1);
}
