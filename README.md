<!-- Generated from site/lyrics-and-chords/page.md by build_readme.py. Edit that file, not this one. (checksum: 537df77ba2ef) -->

# Lyrics & Chords skill (Beta)

The Lyrics & Chords skill for Claude reads song lyric and chord content with structure to help understand the lyrics.

Slug: `lyrics-and-chords`. Licence: GPL-2.0-only (see `LICENSE`).

A skill that loads song lyric and chord files (plain lyrics, chords above words, inline chords, ChordPro, Word files, pasted text), repairs what the readers get wrong, checks that no word or chord was lost, and returns a JSON object: the song with its facts and sections, plus anything it could not resolve. It runs entirely locally and makes no network requests. It is built on ChordSheetJS. The skill's page on musios.app has the download, install steps and examples: https://musios.app/projects/lyrics-and-chords/

Design notes: [docs/design-notes.md](docs/design-notes.md).

Send **Feedback** to [lyrics-and-chords@musios.app](mailto:lyrics-and-chords@musios.app)

## Features

* Reads a wide range of lyric and chord formats
    * [ChordPro](https://musios.app/projects/lyrics-and-chords/examples/example-chordpro.html) - with thanks to [Martijn Versluis](https://github.com/martijnversluis) for the [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) library
    * [Genius.com](https://musios.app/projects/lyrics-and-chords/examples/example-genius.html)
    * [Ultimate Guitar](https://musios.app/projects/lyrics-and-chords/examples/example-ultimate-guitar.html)
    * [Bracket format](https://musios.app/projects/lyrics-and-chords/examples/example-bracket-format.html)
    * [Unbracketed format](https://musios.app/projects/lyrics-and-chords/examples/example-unbracketed-format.html)
    * [Plain text](https://musios.app/projects/lyrics-and-chords/examples/example-plain-text.html)
    * [Chords above words](https://musios.app/projects/lyrics-and-chords/examples/example-chords-above-words.html)
    * [Word documents](https://musios.app/projects/lyrics-and-chords/examples/example-word-documents.html)
* Educational use for [genius.com](https://genius.com) and [ultimate-guitar.com](https://ultimate-guitar.com)
* Identifies and corrects many (not all) common errors
* Returns a plain reading plus a JSON object (ChordSheetJS format) that captures the structure in the lyrics (see [Return JSON Object](#return-json-object))
* This skill can be used with other skills, such the [Songwriting Coach](https://musios.app/projects/songwriting-coach/)
* Source code available: it is this repository

## Return JSON Object

Example JSON object:

```json
{
  "status": "ok",
  "missing": [],
  "questions": [],
  "problems": [],
  "notes": ["format: chords-over-words"],
  "setAside": [],
  "song": {
    "type": "chordSheet",
    "lines": [
      { "type": "line", "items": [{ "type": "tag", "name": "title", "value": "Invented Song", "attributes": {} }] },
      { "type": "line", "items": [{ "type": "tag", "name": "start_of_verse", "value": "Verse 1", "attributes": {} }] },
      { "type": "line", "items": [
        { "type": "chordLyricsPair", "chords": "Am", "chord": null, "lyrics": "Some invented ", "annotation": "" },
        { "type": "chordLyricsPair", "chords": "C", "chord": null, "lyrics": "words here", "annotation": "" } ] },
      { "type": "line", "items": [{ "type": "tag", "name": "end_of_verse", "value": "", "attributes": {} }] }
    ]
  }
}
```

* `status` is `ok`, `needs-info` (loaded, but the title, the credits or the date is missing, and `questions` says what to ask) or `failed` (`problems` says why).
* `song` is [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS)'s JSON: song facts as tag lines, sections as `start_of_...` and `end_of_...` tags, and each lyric line as a list of chord-and-lyric pairs.

## Build and install

```
npm install            # once: fetches ChordSheetJS and the bundler
npm test               # the tests (invented lyrics only)
python3 build.py       # builds dist/lyrics-and-chords.skill
```

The build checks `SKILL.md` against the Agent Skills rules, bundles ChordSheetJS into one file so the skill needs no `npm install`, copies the scripts, writes `NOTICE.txt`, zips the folder, and then runs the packaged scripts from a folder outside this repo as a test. `dist/` is generated: never edit it by hand.

The package needs only Node.js 18 or later. To install it:
- **Claude Code:** unzip `dist/lyrics-and-chords.skill` into `~/.claude/skills/`, so that `~/.claude/skills/lyrics-and-chords/SKILL.md` exists.
- **claude.ai:** upload the `.skill` file in Customize > Skills.

## Publishing to musios.app

Same pattern as the Songwriting Coach. `site/lyrics-and-chords/page.md` is the one source for this README and for the web page on musios.app. Text both need is written once; README-only text and page-only text are each fenced by a pair of HTML-comment markers named `readme` and `page` (the format is described at the top of `site/render_page.py`). Edit `page.md`, never `README.md`: the README is generated and carries a checksum, and the tests fail if it is out of date.

```
python3 build_readme.py            # write README.md from page.md
python3 build_readme.py --check    # say whether README.md is up to date
```

After `python3 build.py` and a commit:

```
python3 publish_site.py                 # or --site PATH for a different clone of musios-app.github.io
```

This renders the page from `page.md` and copies it, the icon, the `.skill` (a current copy and a versioned one) and a source zip into `projects/lyrics-and-chords/` of the site clone. It refuses to run if the `.skill` is out of date or tracked files are uncommitted, and it never touches git in the site folder: review and push the site yourself. The source zip is made with `git archive`, because the GPL asks that anyone who receives the `.skill` can get the source.

## ChordSheetJS

- Home page: https://github.com/martijnversluis/ChordSheetJS
- API docs: https://martijnversluis.github.io/ChordSheetJS/
- Try it online (ChordFiddle): https://martijnversluis.github.io/ChordFiddle/
- npm: https://www.npmjs.com/package/chordsheetjs
- Version installed here: 18.0.0, licence GPL-2.0-only, no runtime dependencies.

ChordSheetJS describes itself as "a JavaScript library for parsing and formatting chord sheets".

### Key functions

- Parse a chord sheet into a `Song` object (`ChordProParser`, `ChordsOverWordsParser`, `UltimateGuitarParser`).
- Format a `Song` back out as text, HTML (table or div layout), ChordPro or chords over words.
- Read ChordPro directives into `Song.metadata` (title, artist, key, capo, tempo and so on).
- Recognise chord-line tokens that are not chords: rhythm symbols (`/`, `x`, `-`), barlines, repeat counts such as `(2x)`, and no-chord markers (`N.C.`).
- Parse, normalise and transpose single chords (`Chord.parse`, `transpose`, `transposeUp`, `transposeDown`, `normalize`, `useModifier`).
- Change chord notation between letter symbols, solfège, Roman numerals and Nashville numbers (needs a `{key}`).
- Handle a capo: leave chords as written, or convert to sounding chords (`decapo`).
- Serialise a `Song` to a plain JavaScript object and back (`ChordSheetSerializer`).
- Basic CSS for the HTML formatters.
- Beta: PDF output (needs `jspdf`, optional) and measured HTML with precise chord positions.

### Formats supported

Read (input):

- ChordPro, including directives
- Chords over words (plain chord sheets)
- Ultimate Guitar style chord sheets (section headers such as `[Chorus]`)

Write (output):

- Plain text
- HTML, table layout
- HTML, div layout
- ChordPro
- Chords over words
- Measured HTML (beta)
- PDF (beta, optional `jspdf`)

Chord notations:

- Letter symbols (`C`, `Dm`)
- Solfège (`Do`, `Rem`)
- Roman numerals (`I`, `ii`)
- Nashville numbers (`1`, `2m`)

Not read by ChordSheetJS: saved web pages (.html), Word files, PDFs, images, and plain lyrics with no chords. Those would be our own code or are out of scope.

Source for this section: the ChordSheetJS README (version 18.0.0).

## Licence and source

Lyrics & Chords is free software under the **GNU General Public License, version 2 only** (GPL-2.0-only), because it includes [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) 18.0.0 by Martijn Versluis, which has the same licence. The licence text is in `LICENSE`. The source is this repository; each release also has a source zip on the skill's page.
