// Tests for the Lyrics & Chords scripts. Run with: npm test
// Every lyric below is invented. No real song text belongs in this file or in the repo.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync, readFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateRawSync } from "node:zlib";

const scripts = fileURLToPath(new URL("../scripts/", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "lc-test-"));
test.after(() => rmSync(dir, { recursive: true, force: true }));

const run = (script, args = [], input = "") =>
  spawnSync(process.execPath, [join(scripts, script), ...args], { input, encoding: "utf8", timeout: 60000 });
const file = (name, text) => {
  const path = join(dir, name);
  writeFileSync(path, text);
  return path;
};
const load = (path, ...args) => {
  const r = run("load.mjs", [path, ...args]);
  return { code: r.status, result: JSON.parse(r.stdout) };
};

// A page shaped like a Genius lyrics page: the data the page embeds for itself, with invented content.
function fakePage(lyrics, { writers = ["Ann B"], date = "2020-01-01" } = {}) {
  const children = [];
  lyrics.split("\n").forEach((line, i, all) => {
    children.push(line);
    if (i < all.length - 1) children.push({ tag: "br" });
  });
  const state = {
    songPage: { song: 1, lyricsData: { body: { tag: "root", children } } },
    entities: {
      songs: { 1: { title: "Invented Song", artistNames: "Ann B & Cal", writerArtists: [10], releaseDate: date } },
      artists: { 10: { name: writers[0] } },
      albums: {},
    },
  };
  const literal = JSON.stringify(state).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  return `<!doctype html><html><body><script>window.__PRELOADED_STATE__ = JSON.parse('${literal}');</script></body></html>`;
}
const sectionsOf = (song) => song.lines.flatMap((l) => l.items.filter((x) => x.type === "tag" && x.name.startsWith("start_of_")).map((x) => x.value));
const commentsOf = (song) => song.lines.flatMap((l) => l.items.filter((x) => x.type === "tag" && x.name === "comment").map((x) => x.value));
const chordsOf = (song) => song.lines.flatMap((l) => l.items.filter((x) => x.type === "chordLyricsPair" && x.chords).map((x) => x.chords));
const lyricLinesOf = (song) =>
  song.lines.map((l) => l.items.filter((x) => x.type === "chordLyricsPair").map((x) => x.lyrics).join("")).filter((t) => t.trim());

const WITH_PERFORMERS = [
  "[Intro]", "Invented words one", "", "[Verse 1: Ann B]", "Made up line two", "Made up line three", "",
  "[Chorus: Ann B & Cal]", "Pretend chorus line", "Pretend chorus again", "", "[Bridge: Cal & Ann B]", "Imaginary bridge line",
].join("\n");

test("a page whose headers name performers loads as real sections", () => {
  const { code, result } = load(file("performers.html", fakePage(WITH_PERFORMERS)));
  assert.equal(code, 0);
  assert.equal(result.status, "ok");
  assert.deepEqual(result.problems, []);
  assert.deepEqual(sectionsOf(result.song), ["Intro", "Verse 1", "Chorus", "Bridge"]);
  assert.deepEqual(commentsOf(result.song), ["Ann B", "Ann B & Cal", "Cal & Ann B"]);
  assert.deepEqual(chordsOf(result.song), [], "no section label may ever appear as a chord");
});

test("the section count equals the number of bracketed headers on the page", () => {
  const { result } = load(file("count.html", fakePage(WITH_PERFORMERS)));
  const headers = WITH_PERFORMERS.split("\n").filter((l) => /^\[.*\]$/.test(l)).length;
  assert.equal(sectionsOf(result.song).length, headers);
});

test("a page whose headers have no performers loads the same way", () => {
  const plain = WITH_PERFORMERS.replace(/: [^\]]*\]/g, "]");
  const { result } = load(file("plain.html", fakePage(plain)));
  assert.equal(result.status, "ok");
  assert.deepEqual(sectionsOf(result.song), ["Intro", "Verse 1", "Chorus", "Bridge"]);
  assert.deepEqual(commentsOf(result.song), []);
  assert.deepEqual(chordsOf(result.song), []);
});

test("a two-word lyric line such as an ad-lib credit stays a lyric on a page", () => {
  const lyrics = ["[Verse 1: Ann B]", "Made up line", "Ann B", "", "[Chorus: Cal]", "Pretend line"].join("\n");
  const { result } = load(file("adlib.html", fakePage(lyrics)));
  assert.equal(result.status, "ok");
  assert.deepEqual(chordsOf(result.song), []);
  assert.ok(lyricLinesOf(result.song).includes("Ann B"));
});

test("a page that is not Genius fails with a plain message", () => {
  const { code, result } = load(file("other.html", "<!doctype html><html><body>hello</body></html>"));
  assert.equal(code, 1);
  assert.equal(result.status, "failed");
  assert.match(result.problems[0].message, /not a page I can read/);
});

test("bare chord letters as headers do not break a chord sheet", () => {
  const sheet = "[Verse A]\nAm       C\nSome invented words here\n\n[B]\nG        D\nMore invented words\n";
  const { result } = load(file("letters.txt", sheet));
  assert.deepEqual(result.problems, []);
  assert.deepEqual(sectionsOf(result.song), ["Verse A", "B"]);
  assert.deepEqual(chordsOf(result.song), ["Am", "C", "G", "D"]);
});

test("check fails when a header has been turned into a chord", () => {
  const path = file("headers.txt", "[Verse 1: Ann B]\nMade up line\n\n[Chorus: Cal]\nPretend line\n");
  const song = JSON.parse(run("parse.mjs", [path, "--format", "lyrics-only"]).stdout);
  // damage the song the way a chord reader would: every header becomes a "chord" and the sections are gone
  const damaged = { type: "chordSheet", lines: song.lines
    .filter((l) => !(l.items.length === 1 && l.items[0].type === "tag"))
    .map((l, i) => (i % 3 === 0 ? { type: "line", items: [{ type: "chordLyricsPair", chords: i === 0 ? "Verse 1: Ann B" : "Chorus: Cal", chord: null, lyrics: "", annotation: "" }] } : l)) };
  const checked = run("check.mjs", ["--original", path], JSON.stringify(damaged));
  assert.equal(checked.status, 1);
  const kinds = JSON.parse(checked.stdout).problems.map((p) => p.kind);
  assert.ok(kinds.includes("not-a-chord"));
  assert.ok(kinds.includes("sections-missing"));
});

test("ChordPro text with [Header] lines reads the headers as sections and the inline chords as chords", () => {
  const sheet = "[Verse 1: Ann B]\n[Am]Made up [C]line\nPretend [G]line\n\n[Chorus]\n[F]More invented words\n";
  const { code, result } = load(file("hybrid.txt", sheet));
  assert.equal(code, 0);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(sectionsOf(result.song), ["Verse 1", "Chorus"]);
  assert.deepEqual(chordsOf(result.song), ["Am", "C", "G", "F"]);
});

test("a bar mark touching a chord is a mark of its own", () => {
  const sheet = "[Verse 1]\n| G#m7 | Emaj7| Emaj7 |\nMade up line\n";
  const { code, result } = load(file("pipes.txt", sheet));
  assert.equal(code, 0);
  assert.deepEqual(result.problems, []);
  assert.ok(chordsOf(result.song).filter((c) => c === "Emaj7").length === 2);
});

test("check fails when an ordinary word is read as a chord", () => {
  const path = file("word.txt", "[Verse 1]\nMade up line\nAnn B\n\n[Chorus]\nPretend line\n");
  const parsed = run("parse.mjs", [path, "--format", "ultimate-guitar"]);
  const checked = run("check.mjs", ["--original", path], parsed.stdout);
  assert.equal(checked.status, 1);
  assert.ok(JSON.parse(checked.stdout).problems.some((p) => p.kind === "not-a-chord"));
});

test("a changed word, a lost line and an added line are all caught", () => {
  const path = file("three.txt", "One two three\nFour five six\nSeven eight nine\n");
  const song = JSON.parse(run("parse.mjs", [path]).stdout);
  const lyric = (l) => l.items[0].lyrics;
  const changed = structuredClone(song);
  changed.lines[0].items[0].lyrics = lyric(song.lines[0]).replace("two", "2");
  const lost = structuredClone(song);
  lost.lines.splice(1, 1);
  const added = structuredClone(song);
  added.lines.splice(1, 0, { type: "line", items: [{ type: "chordLyricsPair", chords: "", chord: null, lyrics: "Invented extra", annotation: "" }] });
  for (const [name, damaged, kind] of [["changed", changed, "changed"], ["lost", lost, "missing"], ["added", added, "extra"]]) {
    const r = run("check.mjs", ["--original", path], JSON.stringify(damaged));
    assert.equal(r.status, 1, name);
    assert.ok(JSON.parse(r.stdout).problems.some((p) => p.kind === kind), name);
  }
});

test("spacing does not matter to the check but joined words do", () => {
  const original = file("spaced.txt", "Hello   world\n    Second line  \n");
  const same = run("parse.mjs", [file("tidy.txt", "Hello world\nSecond line\n")]).stdout;
  assert.equal(run("check.mjs", ["--original", original], same).status, 0);
  const joined = run("parse.mjs", [file("joined.txt", "Helloworld\nSecond line\n")]).stdout;
  assert.equal(run("check.mjs", ["--original", original], joined).status, 1);
});

test("chords above words keep their words, positions and names", () => {
  const sheet = "[Verse 1]\nEbmaj7     Gm\nInvented words here\n";
  const parsed = run("parse.mjs", [file("chords.txt", sheet)]);
  const out = run("format.mjs", ["--as", "chords-over-words"], parsed.stdout).stdout;
  assert.match(out, /Ebmaj7/, "the chord name is written as read, not as Ebma7");
  assert.equal(run("check.mjs", ["--original", file("chords2.txt", sheet)], parsed.stdout).status, 0);
});

test("set-aside takes title lines out, and check needs to be told", () => {
  const path = file("titled.txt", "Invented Title\nWords and Music: Ann B - 1 May 2020\n\n[Verse 1]\nMade up line\n");
  const parsed = run("parse.mjs", [path]).stdout;
  const aside = run("set-aside.mjs", ["--original", path, "--lines", "1,2"], parsed);
  assert.equal(aside.status, 0);
  assert.equal(run("check.mjs", ["--original", path], aside.stdout).status, 1, "the credit line is missing unless declared");
  assert.equal(run("check.mjs", ["--original", path, "--set-aside", "1,2"], aside.stdout).status, 0);
  assert.equal(run("set-aside.mjs", ["--original", path, "--lines", "4"], parsed).status, 1, "a header is not a lyric line");
});

test("load reports missing facts as questions, and never asks for copyright", () => {
  const { result } = load(file("nofacts.txt", "[Verse 1]\nMade up line\n"));
  assert.equal(result.status, "needs-info");
  assert.deepEqual(result.missing, ["title", "credits", "date"]);
  assert.equal(result.questions.length, 3);
  assert.ok(!result.questions.join(" ").toLowerCase().includes("copyright"));
});

test("load fails cleanly on a broken ChordPro file and gives the line", () => {
  const { code, result } = load(file("broken.cho", "{title: T}\n\n[Am]Line one\n{start_of_verse: V1\nLine [C]three\n"));
  assert.equal(code, 1);
  assert.equal(result.status, "failed");
  assert.match(result.problems[0].message, /line 4/);
});

test("load puts the facts and the written song into one result", () => {
  const path = file("full.txt", "[Verse 1]\nMade up line\n");
  const facts = file("facts.json", JSON.stringify({ title: "Invented", artist: "Ann B", date: "2020" }));
  const { result } = load(path, "--facts", facts, "--as", "chordpro");
  assert.equal(result.status, "ok");
  assert.match(result.output, /\{title: Invented\}/);
});

// ---- Word files: built here from invented paragraphs ------------------------------------------------

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function zip(entries) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const e of entries) {
    const name = Buffer.from(e.name);
    const raw = Buffer.from(e.data);
    const body = e.deflate ? deflateRawSync(raw) : raw;
    const method = e.deflate ? 8 : 0;
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(method, 8);
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(body.length, 18); local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26);
    parts.push(local, name, body);
    const head = Buffer.alloc(46);
    head.writeUInt32LE(0x02014b50, 0); head.writeUInt16LE(20, 4); head.writeUInt16LE(20, 6); head.writeUInt16LE(method, 10);
    head.writeUInt32LE(crc, 16); head.writeUInt32LE(body.length, 20); head.writeUInt32LE(raw.length, 24);
    head.writeUInt16LE(name.length, 28); head.writeUInt32LE(offset, 42);
    central.push(head, name);
    offset += 30 + name.length + body.length;
  }
  const directory = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, directory, end]);
}

const para = (inner) => `<w:p><w:r>${inner}</w:r></w:p>`;
const documentXml = `<?xml version="1.0"?><w:document xmlns:w="w"><w:body>
${para("<w:t>Invented Title</w:t>")}
${para("<w:t>Words &amp; Music: Ann B</w:t>")}
<w:p/>
${para("<w:t>[Verse 1]</w:t>")}
<w:p><w:r><w:t xml:space="preserve">Made up</w:t></w:r><w:r><w:tab/></w:r><w:r><w:t>line</w:t></w:r><w:del w:id="1"><w:r><w:delText>gone words</w:delText></w:r></w:del><w:ins w:id="2"><w:r><w:t> kept words</w:t></w:r></w:ins></w:p>
<w:p><w:pPr><w:rPr><w:del w:id="3" w:author="x"/></w:rPr></w:pPr><w:r><w:t>Second line it&apos;s here</w:t></w:r></w:p>
${para("<w:t>Third line after a deleted mark</w:t>")}
</w:body></w:document>`;
const commentsXml = `<w:comments xmlns:w="w"><w:comment w:id="0"><w:p><w:r><w:t>SECRET COMMENT</w:t></w:r></w:p></w:comment></w:comments>`;
const docx = (name, deflate) =>
  file(name, zip([
    { name: "[Content_Types].xml", data: "<Types/>", deflate },
    { name: "word/document.xml", data: documentXml, deflate },
    { name: "word/comments.xml", data: commentsXml, deflate },
  ]));

for (const [label, deflate] of [["stored", false], ["compressed", true]]) {
  test(`a Word file (${label} zip) loads as its paragraph text only`, () => {
    const { code, result } = load(docx(`song-${label}.docx`, deflate));
    assert.equal(code, 0);
    assert.deepEqual(result.problems, []);
    assert.deepEqual(result.source, { type: "word" });
    const lyrics = lyricLinesOf(result.song).join("\n");
    assert.match(lyrics, /Made up line kept words/, "text, a tab as a space, inserted text kept");
    assert.doesNotMatch(lyrics, /gone words/, "deleted text is ignored");
    assert.doesNotMatch(JSON.stringify(result), /SECRET COMMENT/, "comments are ignored");
    assert.match(lyrics, /Second line it's here/, "entities are decoded");
    assert.match(lyrics, /Third line after a deleted mark/, "a deleted paragraph mark does not swallow what follows");
    assert.deepEqual(sectionsOf(result.song), ["Verse 1"]);
  });
}

test("a zip that is not a Word file fails with a plain message", () => {
  const path = file("not-word.docx", zip([{ name: "readme.txt", data: "hello" }]));
  const { code, result } = load(path);
  assert.equal(code, 1);
  assert.equal(result.status, "failed");
  assert.match(result.problems[0].message, /not a Word/);
});

test("a plain text file with a .docx name is read as text", () => {
  const { result } = load(file("really-text.docx", "[Verse 1]\nMade up line\n"));
  assert.deepEqual(sectionsOf(result.song), ["Verse 1"]);
});

// ---- Labels without brackets, and chord lines the library cannot read --------------------------------

test("section labels without brackets become sections and keep their chords, bar lines included", () => {
  const sheet = [
    "Invented Title", "", "V1", "| Ebmin7 | Db6/F Db |", "Am       C", "Some invented words here", "",
    "CHORUS", "G        D", "More invented words", "", "Bridge", "| Am | G |",
  ].join("\n");
  const { code, result } = load(file("bare.txt", sheet));
  assert.equal(code, 0);
  assert.deepEqual(result.problems, []);
  assert.deepEqual(sectionsOf(result.song), ["V1", "CHORUS", "Bridge"]);
  assert.deepEqual(chordsOf(result.song).filter((c) => c !== "|"), ["Ebmin7", "Db6/F", "Db", "Am", "C", "G", "D", "Am", "G"]);
});

test("a lyric line that merely starts like a label is not made a section", () => {
  const sheet = "Am       C\nChorus of invented birds\n\nV1\nMade up line\n";
  const { result } = load(file("labelish.txt", sheet));
  assert.deepEqual(sectionsOf(result.song), ["V1"]);
});

test("a chord line with a chord the library does not know is still read as chords", () => {
  const sheet = "[Verse 1]\n|    Amin     |   D/F#   G(maj7) |\nSome invented words here\n";
  const { code, result } = load(file("odd-chord.txt", sheet));
  assert.equal(code, 0);
  assert.deepEqual(result.problems, []);
  const chords = chordsOf(result.song);
  assert.ok(chords.includes("G(maj7)") && chords.includes("D/F#") && chords.includes("Amin"), chords.join(" "));
  const lyrics = lyricLinesOf(result.song).join("\n");
  assert.doesNotMatch(lyrics, /G\(maj7\)/, "the chord line is not left among the lyrics");
});

test("a chord line on its own, with no lyric below, is kept as chords", () => {
  const { code, result } = load(file("alone.txt", "[Intro]\n| Amin | D/F# G(maj7) |\n\n[Verse 1]\nMade up line\n"));
  assert.equal(code, 0);
  assert.ok(chordsOf(result.song).includes("G(maj7)"));
});

// ---- Saving a readable copy ----------------------------------------------------------------------------

test("--save writes a readable file named from the title and artist, and never replaces one", () => {
  const folder = join(dir, "saved");
  const path = file("save-me.txt", "[Verse 1]\nAm       C\nMade up words here\n");
  const facts = file("save-facts.json", JSON.stringify({ title: "Invented: Song?", artist: "Ann B", date: "2020" }));
  const first = load(path, "--facts", facts, "--save", folder).result;
  assert.equal(first.status, "ok");
  assert.match(first.savedTo, /Invented Song - Ann B\.txt$/, "characters a file name cannot hold are removed");
  const text = readFileSync(first.savedTo, "utf8");
  assert.match(text, /Am/, "chords are kept when the song has chords");
  assert.match(text, /Made up words here/);
  const second = load(path, "--facts", facts, "--save", folder).result;
  assert.match(second.savedTo, /Invented Song - Ann B \(2\)\.txt$/, "an existing file is not replaced");
  assert.equal(readFileSync(first.savedTo, "utf8"), text, "and is left as it was");
});

test("--save writes plain text when the song has no chords", () => {
  const folder = join(dir, "saved-plain");
  const { result } = load(file("plain-save.txt", "[Verse 1]\nMade up words here\n"), "--save", folder);
  assert.match(result.savedTo, /song\.txt$/, "a song with no title or artist is called song");
  assert.doesNotMatch(readFileSync(result.savedTo, "utf8"), /^[A-G][a-z0-9#]*\s*$/m);
});

test("--open needs --save", () => {
  const r = run("load.mjs", [file("open-alone.txt", "One line\n"), "--open"]);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /--open needs --save/);
});

test("--save default goes to Documents, then Desktop, then the home folder", () => {
  const sheet = file("default-save.txt", "[Verse 1]\nMade up words here\n");
  const attempt = (home) => {
    const r = spawnSync(process.execPath, [join(scripts, "load.mjs"), sheet, "--save", "default"], {
      encoding: "utf8", env: { ...process.env, HOME: home, USERPROFILE: home },
    });
    return JSON.parse(r.stdout).savedTo;
  };
  const withBoth = join(dir, "home1");
  mkdirSync(join(withBoth, "Documents"), { recursive: true });
  mkdirSync(join(withBoth, "Desktop"), { recursive: true });
  assert.equal(attempt(withBoth), join(withBoth, "Documents", "song.txt"));
  const desktopOnly = join(dir, "home2");
  mkdirSync(join(desktopOnly, "Desktop"), { recursive: true });
  assert.equal(attempt(desktopOnly), join(desktopOnly, "Desktop", "song.txt"));
  const bare = join(dir, "home3");
  mkdirSync(bare, { recursive: true });
  assert.equal(attempt(bare), join(bare, "song.txt"));
});
