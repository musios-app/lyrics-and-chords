# Lyrics & Chords skill

Slug: `lyrics-and-chords`. Licence: GPL-2.0-only (see `LICENSE`).

A skill that reads song lyric and chord sheets in many layouts and returns them as normalised JSON, or says plainly what it could not resolve. It runs locally; the only network use is fetching a page at an address the user gives, and the user is responsible for having the right to use it. It is built on ChordSheetJS.

Status: provisional. `SKILL.md` defines the capabilities; nothing is built yet. Design notes: [docs/design-notes.md](docs/design-notes.md).

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
