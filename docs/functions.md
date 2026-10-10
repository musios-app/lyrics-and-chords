# Function definitions: Lyrics & Chords skill

9 Oct 2026 · @Andrew

The skill's main capabilities, written as functions: what goes in, what comes out, what can go wrong. Signatures are written in a TypeScript-like notation for clarity; the skill itself is run as command-line scripts.

Status words: **exists** (a script runs today), **planned** (not built), **Claude** (done by the assistant's judgement, not by a script).

The shape of `Song` is decided (9 Oct 2026): ChordSheetJS's own JSON, `{ type: "chordSheet", lines: [...] }`, exactly as `load` returns it. We define no schema of our own; the Songwriting Coach adapts to it.

## Shared types

```ts
type Song = object;            // the parsed sheet (today: ChordSheetJS JSON)
type Format = "chordpro" | "chords-over-words" | "ultimate-guitar";
type Facts = {                 // song facts; values keep their units as written
  title?: string; subtitle?: string; artist?: string | string[];
  composer?: string | string[]; lyricist?: string | string[];
  copyright?: string; album?: string; year?: string;
  key?: string; time?: string; tempo?: string;   // tempo: "124 bpm"
  duration?: string; capo?: string;
};
type Problem = { code: string; message: string; line?: number };
```

## Public and internal functions

Decided 9 Oct 2026: callers ask the skill to **load** content. Most other functions are steps inside `load`.

| Function | Used by | Notes |
|---|---|---|
| `load` | callers (public) | The entry point. See below. |
| `addMetadata` | callers (public) and `load` | Public because it is how answers to "what is missing?" are added. |
| `format` | callers (public) | Writes the loaded song back out. |
| `parse`, `extractPage`, `labelSections`, `check` | `load` only (internal) | Not called directly by a user. |

Because a skill is instructions the assistant follows, not a function it can call, `load` is a workflow written in `SKILL.md`. A script does the exact steps; Claude does the judgement steps.

## 0. load (exists: `scripts/load.mjs`; pasted text, files, Word files (text only), saved Genius pages and Genius addresses; other sites planned)

```ts
load(source:
  | { text: string }            // pasted by the user
  | { file: string }            // a document pasted or dropped by the user
  | { url: string }             // one page, fetched because the user gave the address
): {
  status: "ok" | "needs-info" | "failed";
  song?: Song;                  // present unless failed
  missing: ("title" | "credits" | "year" | string)[];   // important facts not found; never copyright
  questions: string[];          // for the writer: section doubts, missing facts
  problems: Problem[];          // why it failed, or warnings
}
```

What it does, in order:
1. **Get the content.** From the text; from the file (plain text, ChordPro, saved web page, maybe Word); or from the page at the address.
2. **Extract.** For a web page, take the lyrics and song facts out of it (`extractPage`) and drop site noise. For anything else, use the text as given.
3. **Parse** it (`parse`) into a `Song`.
4. **Label sections** (`labelSections`) and pick out any title or metadata lines mixed into the lyrics.
5. **Check** (`check`) that the lyric lines in the song match the source text. A mismatch means `status: "failed"`; nothing is returned as if it were fine.
6. **Report what is missing.** Normally the content comes with its facts. If title, credits or date of publication are not there, `status` is `needs-info` and `missing` names them. The copyright notice is never asked for: it is kept if the source has one, and left out if not (decided 9 Oct 2026; a user will not know it if the page does not say).

When the status is `needs-info`:
1. The assistant asks the user for the missing facts.
2. The answers are added with `addMetadata(song, facts)`.
3. The song is then complete. Facts the user declines to give stay missing, and that is not an error.

**Content with no lyrics.** A bar chart or any sheet with no lyric lines at all (for example `| Am C | D G |` under plain section labels) is out of scope (decided 9 Oct 2026). `load` returns `status: "failed"` and a problem with `code: "no-lyrics"` and a plain message, such as: "This looks like a chord chart with no lyrics. Lyrics & Chords loads songs that have lyrics." The error is raised only when there are no lyric lines at all. If even one lyric line is present, the document loads as usual and the user can see for themselves what it holds (decided 9 Oct 2026: keep it simple). Bars, section labels and chord shorthand do not count as lyric lines.

**Deferred (9 Oct 2026):** the test that decides what counts as a lyric line is not built. Until it is, a lyric-free bar chart loads as a song with bogus lyric lines (the library reads bars and section labels as lyrics: `Song C.pro` gave 47) and no error is raised. Songs with real lyrics are unaffected.

Rules: lyric text is never changed; when unsure, ask; everything runs locally except fetching a page the user has given an address for.

### The url question (decided 9 Oct 2026)

Andrew decided: make it work, and leave respect for copyright to the user. `load(url)` fetches the one page at the address the user gives.

- **One address, one page.** No crawling, no searching, no following links, no bulk download. The skill does not look for lyrics; the user brings the address.
- **The user is responsible** for having the right to use what they load. `SKILL.md` and the README say so in plain words.
- **The network is used only for that fetch.** Nothing about the lyrics is sent anywhere else, and nothing is stored beyond the session unless the user asks.
- **A blocked or failed fetch is reported plainly,** and the user is asked to save the page or paste the text instead (`load` accepts both).
- **No site-specific tricks to get around blocking** (for example pretending to be a browser).

This replaces the earlier rule that the skill never fetches anything.

## 1. parse (exists: `scripts/parse.mjs`) — internal to `load`

```ts
parse(input: { text: string } | { file: string }, options?: { format?: Format }): {
  song: Song;
  formatDetected: Format;       // today printed to standard error
}
```
- Reads one well-formed sheet. Picks ChordPro, chords over words or Ultimate Guitar style itself unless told.
- Keeps every lyric word, space and line break exactly.
- Does not find sections, titles or metadata in plain lyrics; that is `labelSections` and `addMetadata`.
- Formats: ChordPro, chords over words, Ultimate Guitar style, and `lyrics-only` (text with no chords: `[Label: performers]` becomes the section "Label" plus a `comment` holding the performers; used for web pages).
- Errors: unknown format → exit 2. Text the parser cannot read → exit 1 with a message that gives the line and column where it stopped, what it found and expected, the offending line and the one before it with a marker, a hint when the line before has an unclosed `{` or `[`, and, when the format was guessed, the other formats to try with `--format`.

## 2. extractPage (exists for Genius: `scripts/read-page.mjs`)

```ts
extractPage(input: { file: string }, options?: { site?: "genius" }): {
  lyrics: string;               // clean lyric text, as the site holds it
  facts: Facts;                 // song data only; site noise dropped
  notes: Problem[];             // for example "no embedded data found"
}
```
- Reads a page that was saved, pasted or fetched by `load` from an address the user gave. It does not fetch anything itself.
- Genius first: lyrics and facts come from the page's embedded data, not the visible text (which carries clutter).
- Keeps title, artist, writers, album, release date, language, and key and tempo if present. Ignores ids, counts, credits, flags, recording location, ads and links (see `design-notes.md`).
- Errors: not a recognised page → returns `notes` and no lyrics, exit 1.

## 3. labelSections (planned, Claude plus script)

```ts
labelSections(song: Song, context?: { questionsAllowed: boolean }): {
  song: Song;                   // with sections grouped and coded
  sections: { code: string; label: string; confidence: "high" | "medium" | "low"; lines: number[] }[];
  questions: string[];          // things to ask the writer
}
```
- Claude judges what each header or blank-line block is (`V1`, `VERSE 1`, `CHORUS`, an unlabelled repeat). The script applies the labels; Claude never retypes lyric text.
- Recognises title and metadata lines that the parser read as lyrics (`Word & Lyrics: ...`, `G major - 124 bpm`) and hands them to `addMetadata`.
- When unsure, adds a question and lowers `confidence`. Does not guess.

## 4. addMetadata (exists: `scripts/add-metadata.mjs`)

```ts
addMetadata(song: Song, facts: Facts): Song
```
- Adds facts as metadata lines at the top. Replaces a fact with the same name; empty values are skipped.
- Lyric lines are not touched.
- Errors: unknown fact name (for example `bpm`; use `tempo` with the unit in the value) → exit 2; input not from `parse` → exit 1.

## 4b. setAside (exists: `scripts/set-aside.mjs`) — internal to `load`

```ts
setAside(original: string, song: Song, lines: number[]): Song
```
- Removes lines from the song's lyrics because they are not lyrics (a title, a credit line). Lines are named by their number in the original text, so Claude never retypes them (decided 9 Oct 2026).
- Changes nothing, and exits 1, if any named line is not a lyric line in the song (a header, a blank line, a fact already read).
- Pair with `check(..., { setAside: lines })` so the lines are not reported as missing. The check lists them, so a real lyric set aside by mistake can be seen.
- Claude decides which lines hold facts, writes them to `addMetadata`, and tells the writer what it did.

## 5. check (exists: `scripts/check.mjs`)

```ts
check(original: string, song: Song): {
  ok: boolean;
  problems: ({ kind: "changed"; line: number; originalText: string; lyricLine: number; songText: string;
               onlyInOriginal: string[]; onlyInSong: string[]; extraBefore?: string; extraAfter?: string }
           | { kind: "missing"; line: number; text: string }
           | { kind: "extra"; lyricLine: number; text: string })[];
}
```
- Compares the lyric lines in the song with the lyric lines in the original text, in order. Words, punctuation and every other character must match exactly. Spacing does not count (decided 9 Oct 2026: what matters is the meaning of the song): indentation, runs of spaces, trailing spaces and tabs, and non-breaking spaces are all treated as one ordinary space.
- Metadata and section lines are ignored; only lyric lines count.
- A failure means the caller must stop and fall back or ask the writer.
- Does not correct anything, including look-alike characters.
- Besides lyrics it checks that no header was turned into a chord: `not-a-chord` (a chord position holding something that is not a chord name) and `sections-missing` (fewer sections than `[Header]` lines in the original). A bracket counts as chords only if every word in it is a chord, so `[Verse 1: Ann B]` is a header.
- Each problem is one of these kinds, so a caller can act on it: `changed` (a song line and the original line it came from, with `onlyInOriginal` and `onlyInSong` word lists, and `extraBefore` or `extraAfter` when the original line is the song line plus extra text, such as page clutter), `missing` (an original lyric line with no counterpart in the song) and `extra` (a song line with no counterpart in the original). Original line numbers and song lyric line numbers are both given.
- The caller fixes a failure by stating line-level operations on the writer's original (for example "line 1 is page text; remove it"), never by retyping the document, then runs again, with two attempts at most before asking the writer.

## 6. format (exists: `scripts/format.mjs`)

```ts
format(song: Song, as: "text" | "chordpro" | "chords-over-words"): string
```
- Writes the song back out. Chord names are written exactly as read: the library's default rewrites them (`Ebmaj7` becomes `Ebma7`, `Gmin7` becomes `Gm7`), so both rewriting options are turned off. Text and chords-over-words output show only some of the facts (no date or version); ChordPro shows all of them.
- Round trip on plain lyrics is exact apart from one trailing newline.
- Errors: unknown output → exit 2; input cannot be read → exit 1.

## 7. run (planned; probably folded into `load`)

The fixed order of steps now belongs to `load`, so `run` may become the script behind it rather than a separate function.

```ts
run(input: { text: string } | { file: string }, options?: {
  facts?: Facts; as?: "text" | "chordpro" | "chords-over-words"; output?: string;
}): { song: Song; output: string; check: ReturnType<typeof check>; questions: string[] }
```
- Runs the fixed order: read (or `extractPage`), `parse`, `labelSections`, `addMetadata`, `check`, `format`. One command for the caller.
- Stops at the first failed `check` and returns the problem. Never returns output that failed the check.
- `output` writes to a file instead of standard output, so long songs do not flood the conversation.

## Rules for every function

- Local, except `load(url)` fetching the one page the user gave. No other network calls.
- Lyric text is never changed, corrected or normalised.
- When input is unclear, return a plain error or a question; do not guess.
- Data goes to standard output as JSON; progress and warnings go to standard error.
- Documented exit codes: 0 done; 1 input could not be read; 2 bad option or bad facts.
