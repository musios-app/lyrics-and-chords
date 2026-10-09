// Tests for the Lyrics & Chords scripts. Run with: npm test
// Every lyric below is invented. No real song text belongs in this file or in the repo.
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

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

test("check fails when a header is read as a chord", () => {
  const path = file("headers.txt", "[Verse 1: Ann B]\nMade up line\n\n[Chorus: Cal]\nPretend line\n");
  const parsed = run("parse.mjs", [path, "--format", "chordpro"]);
  assert.equal(parsed.status, 0);
  const checked = run("check.mjs", ["--original", path], parsed.stdout);
  assert.equal(checked.status, 1);
  const kinds = JSON.parse(checked.stdout).problems.map((p) => p.kind);
  assert.ok(kinds.includes("not-a-chord"));
  assert.ok(kinds.includes("sections-missing"));
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
