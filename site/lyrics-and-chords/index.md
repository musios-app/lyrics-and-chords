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

The Lyrics & Chords skill for Claude reads song lyric and chord content with structure to help understand the lyrics.

Send **Feedback** to [lyrics-and-chords@musios.app](mailto:lyrics-and-chords@musios.app)

<style>
  .gs-start { border: 1px solid #e8e6dc; border-radius: 24px; background: #f8f8fa; padding: 24px 24px 18px; margin: 1.25rem 0 1.5rem; clear: both; }
  .gs-note { color: #5d5a55; font-size: .85rem; margin-top: .6rem; padding-top: .5rem; border-top: 1px solid #e8e6dc; }
  .gs-steps { display: grid; grid-template-columns: 96px repeat(3, 1fr); gap: 14px; margin: 18px 0 12px; padding: 0; list-style: none; }
  .gs-intro { margin-left: 110px; }
  .gs-dl-table th, .gs-dl-table td { padding: .35rem .75rem !important; }
  .gs-title { display: block; color: #b83eaa; font-weight: 700; font-size: 1.2em; }
  .gs-dl { color: #b83eaa !important; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
  .gs-dl:hover { color: #9d3490 !important; text-decoration: underline; }
  .gs-steps li { background: #fff; border: 1px solid #e8e6dc; border-radius: 16px; padding: 12px 14px; }
  .gs-steps li.gs-icon-cell { background: none; border: 0; padding: 0; align-self: start; }
  .gs-icon-cell img { display: block; width: 96px; height: 96px; }
  .gs-n { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; background: #b83eaa; color: #fff; font-weight: 700; font-size: .85rem; align-items: center; justify-content: center; margin-right: .5rem; }
  .gs-steps b { display: block; margin-bottom: .45rem; line-height: 1.25; }
  .gs-steps .gs-d { color: #5d5a55; font-size: .92rem; line-height: 1.25; }
  .gs-steps .gs-p { display: block; margin-top: .7rem; }
  .gs-steps .gs-p:first-child { margin-top: 0; }
  @media (max-width: 760px) { .gs-intro { margin-left: 0; } .gs-start { padding: 18px 16px 14px; border-radius: 20px; } .gs-steps { grid-template-columns: 1fr; } .gs-steps li.gs-icon-cell { display: none; } }
</style>
<div class="gs-start">
  <div class="gs-intro">
    <b class="gs-title">Installation</b>
    For claude.ai chat & code (online), Claude Desktop chat & code (Mac or Windows).
    For Claude Code in a terminal <a href="#claude-code">see below</a>
  </div>
  <ol class="gs-steps">
    <li class="gs-icon-cell"><img src="images/icon.svg" alt="" width="96" height="96"></li>
    <li><b><span class="gs-n">1</span>Get the file</b>
    <span class="gs-d"><a class="gs-dl" href="downloads/lyrics-and-chords.skill" download>
      Download lyrics-and-chords.skill</a>
    </span></li>
    <li><b><span class="gs-n">2</span>Add the skill to Claude</b><span class="gs-d"><span class="gs-p">Customize &gt; Skills &gt; Add &gt; Upload skill</span><span class="gs-p">Drag and drop the download file</span></span></li>
    <li><b><span class="gs-n">3</span>Load a song</b><span class="gs-d"><span class="gs-p">Open a new chat</span><span class="gs-p">Prompt Claude: <i>&ldquo;Load my lyrics&rdquo;</i></span><span class="gs-p">Paste your lyrics and/or chords or drop their file</span></span></li>
  </ol>
</div>

## Features {#features}

* Reads a wide range of lyric and chord formats
    * [ChordPro](examples/example-chordpro.html) - with thanks to [Martijn Versluis](https://github.com/martijnversluis) for the [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) library
    * [Genius.com](examples/example-genius.html)
    * [Ultimate Guitar](examples/example-ultimate-guitar.html)
    * [Bracket format](examples/example-bracket-format.html)
    * [Unbracketed format](examples/example-unbracketed-format.html)
    * [Plain text](examples/example-plain-text.html)
    * [Chords above words](examples/example-chords-above-words.html)
    * [Word documents](examples/example-word-documents.html)
* Educational use for [genius.com](https://genius.com) and [ultimate-guitar.com](https://ultimate-guitar.com)
* Identifies and corrects many (not all) common errors
* Returns a plain reading plus a JSON object (ChordSheetJS format) that captures the structure in the lyrics (see [Return JSON Object](#return-json-object))
* This skill can be used with other skills, such the [Songwriting Coach](https://musios.app/projects/songwriting-coach/)
* Source code available (see [Downloads](#download))

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

## Return JSON Object {#return-json-object}

Example JSON object:

{% raw %}

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

{% endraw %}

* `status` is `ok`, `needs-info` (loaded, but the title, the credits or the date is missing, and `questions` says what to ask) or `failed` (`problems` says why).
* `song` is [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS)'s JSON: song facts as tag lines, sections as `start_of_...` and `end_of_...` tags, and each lyric line as a list of chord-and-lyric pairs.

## Licence and source

Lyrics & Chords is free software under the **GNU General Public License, version 2 only** (GPL-2.0-only), because it includes [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) 18.0.0 by Martijn Versluis, which has the same licence. The licence text is in the `.skill` file as `LICENSE`, and `NOTICE.txt` says what is included. The source for this version is the source download above (commit {{commit}}).
