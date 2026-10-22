<!--[page]-->
---
layout: default
title: "Lyrics & Chords Skill"
description: Beta. A Claude skill that reads song lyrics and chord sheets in many formats (ChordPro, Genius and Ultimate Guitar pages, plain text, chords above words, Word files), corrects many common errors, and returns a plain reading plus structured JSON. Works with the Songwriting Coach. Free software under the GPL.
tagline: "BETA: Reads a wide range of song lyrics and chord file formats into Claude."
icon: images/icon.svg
gitrepo: https://github.com/musios-app/lyrics-and-chords
software:
  categories: [Music, Songwriting, Lyrics and chord sheets]
  version: "{{version}}"
  download: /projects/lyrics-and-chords/downloads/lyrics-and-chords.skill
  license: https://spdx.org/licenses/GPL-2.0-only.html
  repo: https://github.com/musios-app/lyrics-and-chords
---

## Lyrics & Chords Skill <span class="badge text-bg-warning ms-3">BETA</span> {#lyrics--chords-skill}

<!--[/page]-->
<!--[readme]-->
# Lyrics & Chords skill (Beta)

<!--[/readme]-->
The Lyrics & Chords skill for Claude reads song lyric and chord content with structure to help understand the lyrics.

<!--[readme]-->
Slug: `lyrics-and-chords`. Licence: GPL-2.0-only (see `LICENSE`).

A skill that loads song lyric and chord files (plain lyrics, chords above words, inline chords, ChordPro, Word files, pasted text), repairs what the readers get wrong, checks that no word or chord was lost, and returns a JSON object: the song with its facts and sections, plus anything it could not resolve. It runs entirely locally and makes no network requests. It is built on ChordSheetJS. The skill's page on musios.app has the download, install steps and examples: https://musios.app/projects/lyrics-and-chords/

Design notes: [docs/design-notes.md](docs/design-notes.md).

<!--[/readme]-->
Send **Feedback** to [lyrics-and-chords@musios.app](mailto:lyrics-and-chords@musios.app)

<!--[page]-->
<style>
  .gs-start { position: relative; border: 1px solid #e8e6dc; border-radius: 24px; background: #f8f8fa; padding: 24px 24px 18px; margin: 1.25rem 0 1.5rem; clear: both; }
  .gs-note { color: #5d5a55; font-size: .85rem; margin-top: .6rem; padding-top: .5rem; border-top: 1px solid #e8e6dc; }
  .gs-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin: 18px 0 12px; padding: 0; list-style: none; }
  .gs-intro { margin-right: 110px; min-height: 96px; display: flex; flex-direction: column; justify-content: flex-end; }
  .gs-intro > div { line-height: 1.25; }
  .gs-title { display: block; color: #b83eaa; font-weight: 700; font-size: 1.2em; line-height: 1.25; }
  .gs-dl-table th, .gs-dl-table td { padding: .35rem .75rem !important; }
  .gs-dl { color: #b83eaa !important; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
  .gs-dl:hover { color: #9d3490 !important; text-decoration: underline; }
  .gs-steps li { background: #fff; border: 1px solid #e8e6dc; border-radius: 16px; padding: 12px 14px; }
  .gs-icon { position: absolute; top: 24px; right: 24px; width: 96px; height: 96px; }
  .gs-n { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; background: #b83eaa; color: #fff; font-weight: 700; font-size: .85rem; align-items: center; justify-content: center; margin-right: .5rem; }
  .gs-steps b { display: block; margin-bottom: .45rem; line-height: 1.25; }
  .gs-steps .gs-d { color: #5d5a55; font-size: .92rem; line-height: 1.25; }
  .gs-steps .gs-p { display: block; margin-top: .7rem; }
  .gs-steps .gs-p:first-child { margin-top: 0; }
  @media (max-width: 760px) { .gs-intro { display: block; margin-right: 0; min-height: 0; } .gs-start { padding: 18px 16px 14px; border-radius: 20px; } .gs-steps { grid-template-columns: 1fr; } .gs-icon { display: none; } }
</style>
<div class="gs-start">
  <img class="gs-icon" src="images/icon.svg" alt="" width="96" height="96">
  <div class="gs-intro">
    <b class="gs-title">Installation</b>
    <div>For claude.ai chat & code (online), Claude Desktop chat & code (Mac or Windows).
    For Claude Code in a terminal <a href="#claude-code">see below</a></div>
  </div>
  <ol class="gs-steps">
    <li><b><span class="gs-n">1</span>Get the file</b>
    <span class="gs-d"><a class="gs-dl" href="downloads/lyrics-and-chords.skill" download>
      Download lyrics-and-chords.skill</a>
    </span></li>
    <li><b><span class="gs-n">2</span>Add the skill to Claude</b><span class="gs-d"><span class="gs-p">Customize &gt; Skills &gt; Add &gt; Upload skill</span><span class="gs-p">Drag and drop the download file</span></span></li>
    <li><b><span class="gs-n">3</span>Load a song</b><span class="gs-d"><span class="gs-p">Open a new chat</span><span class="gs-p">Prompt Claude: <i>&ldquo;Load my lyrics&rdquo;</i></span><span class="gs-p">Paste your lyrics and/or chords or drop their file</span></span></li>
  </ol>
</div>

<!--[/page]-->
## Features<!--[page]--> {#features}<!--[/page]-->

* Reads a wide range of lyric and chord formats
    * [ChordPro](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-chordpro.html) - with thanks to [Martijn Versluis](https://github.com/martijnversluis) for the [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) library
    * [Genius.com](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-genius.html)
    * [Ultimate Guitar](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-ultimate-guitar.html)
    * [Bracket format](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-bracket-format.html)
    * [Unbracketed format](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-unbracketed-format.html)
    * [Plain text](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-plain-text.html)
    * [Chords above words](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-chords-above-words.html)
    * [Word documents](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-word-documents.html)
* Educational use for [genius.com](https://genius.com) and [ultimate-guitar.com](https://ultimate-guitar.com)
* Identifies and corrects many (not all) common errors
* Returns a plain reading plus a JSON object (ChordSheetJS format) that captures the structure in the lyrics (see [Return JSON Object](#return-json-object))
* This skill can be used with other skills, such the [Songwriting Coach](https://musios.app/projects/songwriting-coach/)
* Source code available<!--[page]--> (see [Downloads](#download))<!--[/page]--><!--[readme]-->: it is this repository<!--[/readme]-->

<!--[page]-->
## Download {#download}

| Platform | Download |
| --- | --- |
| Claude | [lyrics-and-chords.skill](downloads/lyrics-and-chords.skill) (v{{version}}) |
| Source code | [lyrics-and-chords-{{version}}-source.zip](downloads/lyrics-and-chords-{{version}}-source.zip) |
{: .table .table-bordered .w-auto .gs-dl-table}

## Install, update, remove

### claude.ai and the Claude Desktop (app)

* **Install:** download `lyrics-and-chords.skill` above, then Customize > Skills > + > Upload skill > select the file, and toggle it on
* **Update:** download the new `.skill` and upload it the same way, confirming "Upload and replace"
* **Remove:** Customize > Skills > "..." next to the toggle > Delete

### Claude Code

It needs **Node.js 18 or later** on your computer.

* **Install:** unzip `lyrics-and-chords.skill` into `~/.claude/skills/`, so that `~/.claude/skills/lyrics-and-chords/SKILL.md` exists
* **Update:** replace the contents of `~/.claude/skills/lyrics-and-chords/` with the new version
* **Remove:** delete the `~/.claude/skills/lyrics-and-chords/` folder

<!--[/page]-->
## Return JSON Object<!--[page]--> {#return-json-object}<!--[/page]-->

Example JSON object:

<!--[page]-->
{% raw %}

<!--[/page]-->
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

<!--[page]-->
{% endraw %}

<!--[/page]-->
* `status` is `ok`, `needs-info` (loaded, but the title, the credits or the date is missing, and `questions` says what to ask) or `failed` (`problems` says why).
* `song` is [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS)'s JSON: song facts as tag lines, sections as `start_of_...` and `end_of_...` tags, and each lyric line as a list of chord-and-lyric pairs.

<!--[readme]-->
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

<!--[/readme]-->
## Licence and source

Lyrics & Chords is free software under the **GNU General Public License, version 2 only** (GPL-2.0-only), because it includes [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) 18.0.0 by Martijn Versluis, which has the same licence.<!--[page]--> The licence text is in the `.skill` file as `LICENSE`, and `NOTICE.txt` says what is included. The source for this version is the source download above (commit {{commit}}).<!--[/page]--><!--[readme]--> The licence text is in `LICENSE`. The source is this repository; each release also has a source zip on the skill's page.<!--[/readme]-->
