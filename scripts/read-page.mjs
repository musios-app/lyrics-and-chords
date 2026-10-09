// Lyrics & Chords: take the lyrics and the song facts out of a saved web page.
// Usage: node scripts/read-page.mjs page.html      (or pipe the page on standard input)
// Today only Genius pages are understood. The page's own data is read as text and parsed as JSON;
// none of the page's scripts are run.
// Prints {"site", "lyrics", "facts", "notes"} on standard output.
// Exit codes: 0 read; 1 not a page this script understands; 2 bad option or unreadable input.
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/read-page.mjs <page.html>

Reads the lyrics and song facts from a saved Genius page, using the data the page embeds for itself.
Page clutter (contributor counts, translations, ads, links) is left out, as are ids, view counts,
credits, flags and the site's own copyright notice.

Output (JSON): site, lyrics (clean lyric text), facts (title, artist, writer, album, date),
notes (what was found).

Exit codes: 0 read; 1 not a page this script understands; 2 bad option or unreadable input.`);
  process.exit(0);
}

let page;
try {
  page = args.length ? readFileSync(args[0], "utf8") : readFileSync(0, "utf8");
} catch (err) {
  console.error(`Error: cannot read the page: ${err.message}`);
  process.exit(2);
}

// Decode the text of a single-quoted JavaScript string literal without running anything.
function decodeJsString(raw) {
  return raw.replace(/\\(u\{[0-9a-fA-F]+\}|u[0-9a-fA-F]{4}|x[0-9a-fA-F]{2}|[\s\S])/g, (_, e) => {
    if (e[0] === "u" && e.length > 1) return String.fromCodePoint(parseInt(e.replace(/[u{}]/g, ""), 16));
    if (e[0] === "x" && e.length > 1) return String.fromCharCode(parseInt(e.slice(1), 16));
    return { n: "\n", t: "\t", r: "\r", b: "\b", f: "\f", v: "\v", 0: "\0" }[e] ?? e;
  });
}

function geniusState(html) {
  const m = html.match(/__PRELOADED_STATE__\s*=\s*JSON\.parse\('((?:[^'\\]|\\[\s\S])*)'\)/);
  if (!m) return null;
  try {
    return JSON.parse(decodeJsString(m[1]));
  } catch {
    return null;
  }
}

const state = geniusState(page);
const song = state && state.songPage && state.entities && state.entities.songs && state.entities.songs[state.songPage.song];
const body = state && state.songPage && state.songPage.lyricsData && state.songPage.lyricsData.body;
if (!song || !body) {
  console.error(
    "Error: this is not a page I can read. Today only Genius lyrics pages are understood.\n" +
    "If it is a lyrics page, save the lyrics as text or paste them, and load that instead.",
  );
  process.exit(1);
}

// The lyrics: the text of the page's lyric tree, with a line break at each <br>.
let lyrics = "";
(function walk(node) {
  if (typeof node === "string") { lyrics += node; return; }
  if (!node) return;
  if (node.tag === "br") { lyrics += "\n"; return; }
  (node.children || []).forEach(walk);
})(body);
lyrics = lyrics.replace(/\r\n?/g, "\n").replace(/^\n+|\s+$/g, "") + "\n";

// The song facts: only what is about the song. Ids, counts, credits, flags and links are left out.
const names = (table, ids) => (ids || []).map((id) => state.entities[table] && state.entities[table][id] && state.entities[table][id].name).filter(Boolean);
const facts = {};
if (song.title) facts.title = song.title;
if (song.artistNames) facts.artist = song.artistNames;
const writers = names("artists", song.writerArtists);
if (writers.length) facts.writer = writers;
const album = song.album && state.entities.albums && state.entities.albums[song.album];
if (album && album.name) facts.album = album.name;
if (song.releaseDate) facts.date = song.releaseDate;

const notes = [`read a Genius page: "${song.title}" by ${song.artistNames}`];
if (!facts.date) notes.push("the page has no release date");
if (!writers.length) notes.push("the page lists no writers");

console.log(JSON.stringify({ site: "genius", lyrics, facts, notes }, null, 2));
