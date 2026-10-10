---
name: lyrics-and-chords
description: Reads song lyric and chord sheets (plain lyrics, chords above words, inline chords, ChordPro, saved chord-site pages) and returns them as structured JSON, or says plainly what it could not resolve. Runs locally; the only network use is fetching a page whose address the user gives. Use to parse, convert or check a lyric or chord file, to load a Word file or a Genius lyrics page, or when someone names a song to look at ("show me the lyrics for September by Earth, Wind & Fire": Claude finds the Genius page and loads it). Not for critiquing or writing lyrics.
license: GPL-2.0-only
compatibility: Requires Node.js 18 or later. No network use except fetching a web address the user gives.
metadata:
  version: "0.1.0"
---

# Lyrics & Chords (provisional)

Version 0.1, provisional. The scripts under "What works now" are built; capabilities marked planned are not.

## What works now

Eight scripts in `scripts/`. `load.mjs` runs the others in order; each of them also works on its own. Each takes data on standard input or from a file, prints JSON or text on standard output, and prints notes and errors on standard error.

| Script | Does | Exit codes |
|---|---|---|
| `load.mjs <file \| Word file \| web address \| ->` | **The all-in-one.** Takes a file, pasted text (`-`), a Word file (text only), a saved web page, or a web address (fetched once, because the user gave it; Genius lyrics pages only today; the user is responsible for having the right to use the content). Parse, set aside lines, add facts, check, optionally write out, in one command: `--facts facts.json`, `--set-aside 1,2`, `--as chordpro`, `--output song.cho`, `--format`. `--save FOLDER` (or `--save default`: Documents) writes a readable file named `<title> - <artist>.txt` (chords above the words if the song has chords; never replaces a file) and `--open` opens it in the default app. `-` reads pasted text on standard input. Prints one JSON result: `status` (`ok`, `needs-info` when a title, credits or date is missing, or `failed`), `missing`, `questions`, `problems`, `notes`, `setAside`, `song`, and `output`. A song that fails the check is never returned. | 0 loaded; 1 failed; 2 bad option |
| `parse.mjs <file>` | Reads one well-formed sheet and prints ChordSheetJS's own JSON, unchanged. Picks ChordPro, chords over words or Ultimate Guitar style itself, or takes `--format` (also `lyrics-only`: text with no chords, where a line that is only `[Something]` is a section header and nothing is ever read as a chord). A sheet it cannot read gives the line and column, the lines around it and a hint. | 0 done; 1 could not parse; 2 unknown format |
| `read-docx.mjs <song.docx>` | Takes the text out of a Word file: one line for each paragraph, a tab as a space. Comments, deleted text (tracked changes), formatting, styles and pictures are ignored; text inside a table comes out one line per paragraph. | 0 read; 1 not a Word file it can read; 2 bad option or file |
| `read-page.mjs <page.html>` | Takes the lyrics and song facts (title, artist, writers, album, date) out of a saved Genius page, using the data the page embeds for itself, parsed as text: none of the page's code is run. Clutter, ids, counts, credits and the site's own copyright are left out. A page it does not understand gives a plain message. | 0 read; 1 not a page it understands; 2 bad option or input |
| `add-metadata.mjs --meta facts.json` | Adds song facts (title, subtitle, artist, writer, composer, lyricist, copyright, album, year, date, version, key, time, tempo, duration, capo) to the parsed JSON as metadata lines. Lyric lines are not touched. Values are kept as written, for example `"tempo": "124 bpm"`. | 0 done; 1 input not from parse; 2 bad option or facts |
| `set-aside.mjs --original <file> --lines 1,2` | Takes lines that are not lyrics (a title, a credit line) out of the parsed song. Lines are named by their number in the original, never retyped. Changes nothing if a named line is not a lyric line. | 0 done; 1 a named line is not a lyric line; 2 bad option or input |
| `check.mjs --original <file> [--set-aside 1,2]` | Confirms the lyric lines in the parsed song match the original, and that every chord is still there. Ignores all spacing; compares words and punctuation exactly. Reports `changed`, `missing` and `extra` lines, `chords-missing`, `not-a-chord` (something other than a chord name sitting in a chord position, such as a header or a word) and `sections-missing` (fewer sections in the song than `[Header]` lines in the original). Lines named in `--set-aside` are not reported as missing and are listed in the output. | 0 match; 1 mismatch; 2 bad option or input |
| `format.mjs [--as text \| chordpro \| chords-over-words]` | Turns the parsed JSON back into text. Chord names are written exactly as read (the library would rewrite `maj7` as `ma7`). | 0 done; 1 could not format; 2 unknown output |

```
node scripts/parse.mjs song.cho | node scripts/add-metadata.mjs --meta facts.json | node scripts/format.mjs --as chordpro
node scripts/parse.mjs song.cho | node scripts/check.mjs --original song.cho
```

A web page's lyrics have no chords, so `load` reads a page with `lyrics-only`: `[Verse 1: Name]` becomes the section "Verse 1" followed by a `comment` line holding the performer, and a performer's name such as "Ann B" can never be read as a chord.

Parse also makes these repairs, because the library gets them wrong:
- Section labels written without brackets (`V1`, `VERSE 1`, `Chorus`, `Chorus x2`) are read as section headers; the chord readers would take `V1` for chords. Header lines (`[Verse 1]`) become sections, and `[Verse 1: Name]` becomes the section "Verse 1" plus a `comment` with the performer.
- Text with chords written inline (`[Am]word`) and `[Header]` lines is read as ChordPro, with the headers turned into sections first.
- A chord line the library cannot give back exactly as written (`G(maj7)`, `Em7(♭5)/D`, `| Emaj7| Emaj7 |`) is read by this skill instead: its chords are attached to the lyric line below by column. A bar mark touching a chord counts as a mark of its own. `x2` and `2x` are repeat marks.
- A line of two or more bracketed chords (`[D] [Am] [G/D]`) is read as a chord line.
- A section runs from its header to the next header, across blank lines; padding spaces on chords are trimmed.

Known limits: a chord line that has a word in it (`Intro | Gm79 | C7`) is read as a lyric line, and `check` says so; a bracket that is never closed is a parse error that names the line (fix it in the file).

Not yet built: pages from sites other than Genius, finding a song by its title and artist, labelling sections beyond the headers the writer wrote, annotations read from the text (such as backing vocals), Nashville numbers (a ChordPro file with number chords is read, but `check` does not accept numbers as chords, so it fails). The scripts are self-contained and need only Node.js 18 or later.

## What it is for

Turn a lyric or chord sheet in almost any common layout into one predictable JSON structure. It is a helper for other skills (the Songwriting Coach in particular) and is useful on its own.

## What it does not do

- Judge, rate or rewrite lyrics, or suggest chords.
- Analyse rhyme, rhythm or syllables.
- Crawl sites or download in bulk. It loads one text, file or web address at a time. The scripts never search; when the user names a song, Claude finds its page (see "Finding a song by name"). The user is responsible for having the right to use that content.
- Read PDFs or images.
- Load a chord chart that has no lyrics (bars and section labels only). It says so plainly and returns nothing.

## Capabilities

Source: **library** = ChordSheetJS (GPL-2.0-only, bundled); **own** = our code on top; **model** = the assistant's judgement; **maybe** = not committed.

### 1. Read these layouts

| Input | Source |
|---|---|
| ChordPro, with `{directives}` | library |
| Chords above words | library |
| Ultimate Guitar style text | library |
| Inline chords `[Am]word [C]word` | library |
| Plain lyrics, no labels (blank-line blocks) | own, then model for labelling |
| Bracketed headers `[Verse 1]`, `[Chorus]` | own |
| Bare or ALL CAPS headers, with colons or `x2` | own |
| Saved Ultimate Guitar and Chordie pages (.html) | own |
| Pasted-text clutter: extra blank lines, smart quotes, non-breaking spaces, HTML leftovers | own |
| Word (.docx) | maybe |
| Nashville numbers, lead sheets | maybe |

### 2. Classify every line

Header, chord line, tab line, metadata, directive, annotation (`x2`, capo, `N.C.`, timestamps) or lyric. Odd cases are reported, not guessed. (own)

### 3. Return JSON

Built, in ChordSheetJS's own shape: `{ "type": "chordSheet", "lines": [...] }`, where each lyric line is a list of chord-and-lyric pairs and the song facts are tag lines at the top. (library)

Decided (9 Oct 2026): this is the output. We define no schema of our own, and no normalised section codes. Sections are the `start_of_...` / `end_of_...` tags; annotations use the `annotation` field and `comment` tags. The Songwriting Coach adapts to this JSON. (library)

### 4. Keep the meaning of the lyrics

Lyric words are copied from the input by a script, never retyped by the model. Spacing may change (indentation, runs of spaces, trailing spaces); words and punctuation may not. (own)

### 5. Check a result against its source

Built (`check.mjs`). Compares the JSON's lyric lines with the original text and reports each difference as `changed`, `missing` or `extra`, so a caller can fix it or fall back safely. (own)

### 6. Say what it could not resolve

Unrecognised blocks, uncertain labels and a list of questions for the writer, instead of a confident wrong answer. The model resolves these or asks. (own plus model)

### 7. Write the structure back out

Built (`format.mjs`): plain text, ChordPro, or chords above words. (library)

### 8. Add song facts

Built (`add-metadata.mjs`): title, artist, credits, key, tempo and the other facts listed above are added after loading, from a facts file. Copyright is added only if the source has it; the user is never asked for it. (own)

### 9. Load

Built for pasted text, files, saved Genius pages and Genius web addresses (`load.mjs`); other sites are planned. One entry point that runs the steps in a fixed order: read, parse, set aside non-lyric lines, add facts, check, then report any missing facts. If title, credits or date of publication are missing, the user is asked and the answers go in with step 8. (own plus model)

## Finding a song by name

When the user names a song instead of giving a file or an address ("I want to study September by Earth, Wind & Fire"):

1. Use your own web search, once, with the title, the artist and "genius lyrics". The scripts do not search.
2. Choose the one result that is a Genius lyrics page (an address ending `-lyrics` on genius.com) whose title and artist match what was asked. Never guess an address. If several versions match (live, cover, remix), or none does, say what you found and ask which.
3. Tell the user which page you are about to load (title and artist), then run `load.mjs` with that address, adding `--save default --open` when the song is under copyright (see Rules).
4. Compare the title and artist in the loaded facts with the request. If they differ, say so and stop.
5. If there is no Genius page, say so plainly and ask for the lyrics as text or a file. Do not load a page from another site: only Genius pages are understood.

The user is responsible for having the right to use what they load.

## Title, credits and other facts

Plain-text sheets usually open with a title and a credit line that nothing marks as such (`Song D`, then `Music & Lyrics: Andrew Hunt - 17 April 2025 (v4)`). The parser reads them as lyric lines. Fixing that is Claude's job, with scripts doing the exact steps:

1. After `parse`, read the lines before the first section. Decide which are the title, the credits, a date, a version, a key or a tempo. Labelled lines such as `Key: D major` are already read as facts.
2. Write a facts file for `add-metadata` (title, lyricist, composer, date, version...). Copy words exactly as written. Use only what the lines say: do not guess a year or a role.
3. Run `set-aside.mjs --original <file> --lines N,N` for the lines that held those facts. Name the lines by number; never retype them.
4. Run `check.mjs` with the same line numbers as `--set-aside`. The check lists the lines set aside.
5. Tell the writer which lines you treated as facts and not lyrics, so a mistake can be seen. If it is unclear whether a line is a lyric or a fact, ask; do not set it aside.

If `set-aside` refuses a line, it is not a lyric line in the song (a header, a blank line or a fact already read). Leave it.

## When something goes wrong

Work through three steps, in this order, and stop at the first that solves it.

1. **The scripts.** `parse` and `check` report problems with a line number. Where a script can fix it safely (for example, a section that is never closed), it does.
2. **Claude, up to two more attempts.** Read the script's message and state a line-level fix on the writer's original: "line 1 is page text, remove it", "line 12 is a header, wrap it in brackets". A script applies it. Never retype the document: that is how a lyric word gets changed. Run `check` against the writer's original each time. After two attempts, stop.
3. **The writer.** Tell them plainly. Never pass raw script or parser text to the writer.

### What to tell the writer

Every message to the writer has five parts:
1. **What went wrong,** in one plain sentence with no parser words.
2. **The line or lines involved,** quoted with their line numbers, so they can find them in their own file.
3. **What was already tried,** so they do not repeat it.
4. **One or two concrete choices:** fix line N like this, paste the text here instead, or tell me to leave a line out.
5. **A statement that their file has not been changed.**

Ask them about structure (a bracket, a header, page text). Never ask them to change their lyrics to suit the tool.

Examples:

> I couldn't read your file. Line 4 starts a section with `{` but never closes it with `}`:
> `line 4: {start_of_verse: V1`
> If you add the `}` and load it again, it should work. Or paste the text here and I'll load it that way. Your file hasn't been changed.

> The first line of the lyrics has extra text in front of it: "1 ContributorBecause Lyrics". I didn't want to delete anything from your lyrics on my own. Should I treat that as page text and leave it out?

> This looks like a chord chart with no lyrics, so Lyrics & Chords can't load it. If it has lyrics somewhere that I've missed, tell me where they start.

For a web page the writer cannot edit the page itself, so the choices are: save the page and give me the file, or paste the text.

Not every problem raises an error. A header with a missing bracket (`[Verse 1`) loads as an ordinary lyric line. That comes up as a question when sections are labelled, not as an error.

## Rules

- For a song under copyright (if you are not sure it is out of copyright, treat it as under copyright), do not print its lyrics in the conversation. Load it with `--save default --open` (the user's Documents folder; a folder name can be given instead): the processed lyrics, with the chords above the words if there are any, are saved as `<title> - <artist>.txt` (an existing file is never replaced) and opened in the user's default app. `default` is Documents on macOS and Windows (Desktop, then the home folder, if there is no Documents). If your environment provides its own folder for files the user can download or open, use that instead. Do not assume the user has a particular setup. Tell the user the file name and where it is, and if the file cannot be opened or saved, say so and say what you did instead. Then report the facts, the sections and whatever was asked for (counts, rhymes, repetition), referring to lines by section and number.
- Everything runs locally, except fetching the one page at an address the user gives.
- Never change a lyric word, line break or spelling to tidy it.
- When unsure whether a line is lyric, label or annotation, ask.
- No copyrighted lyrics in this repo; test files are scrubbed.

## Not decided

v1 input list (Word, Nashville, sites other than Genius); bundling method for the scripts.

## Licence

GPL-2.0-only, because it bundles ChordSheetJS (GPL-2.0-only). Full text in `LICENSE`.
