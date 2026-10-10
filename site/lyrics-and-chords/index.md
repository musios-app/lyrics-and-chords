---
layout: default
title: "Lyrics & Chords Skill"
description: Reads song lyrics and chord files into Claude and returns a plain reading plus a JSON object.
sitemap: false
noindex: true
---

## Lyrics & Chords Skill

The Lyrics & Chords skill for Claude read song lyric and chord content with structure to help understand of the lyrics.

* Reads a wide range of lyric and chord formats (see below)
* Able to read from [genius.com](https://genius.com), [ultimate-guitar.com](https://ultimate-guitar.com) and other sites - for educational uses only.
* Identifies and corrects many (not all) common errors
* Returns a plain reading plus a JSON object (ChordSheetJS format) that captures the structure in the lyrics (see [Return JSON Object](#return-json-object))
* This skill can be used with other skills, such the [Songwriting Coach](https://musios.app/projects/songwriting-coach/).
* Source code available (see [Downloads](#download))

*Supported Formats:*

* [ChordPro](examples/example-chordpro.html) - with thanks to [Martijn Versluis](https://github.com/martijnversluis) for the [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) library.
* [Genius.com](examples/example-genius.html)
* [Ultimate Guitar](examples/example-ultimate-guitar.html)
* [Bracket format](examples/example-bracket-format.html)
* [Unbracketed format](examples/example-unbracketed-format.html)
* [Plain text](examples/example-plain-text.html)
* [Chords above words](examples/example-chords-above-words.html)
* [Word documents](examples/example-word-documents.html)

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

## Download {#download}

| Platform | Download |
| --- | --- |
| Claude | [lyrics-and-chords.skill](downloads/lyrics-and-chords.skill) (v{{version}}) |
| Source code | [lyrics-and-chords-{{version}}-source.zip](downloads/lyrics-and-chords-{{version}}-source.zip) |

## Availability

The scripts are tested on macOS with Node.js 22. The skill has not yet been tested on the other platforms, and the parts that need Claude's own judgement (reading a title and credit line, asking for what is missing) are still being tried out.

* ❓ claude.ai (web)
* ❓ Claude Code
* ❓ Claude desktop app

Legend: ✅ works · ❓ not tested yet

It needs **Node.js 18 or later** wherever the scripts run.

## Install, update, remove

### claude.ai and the Claude desktop app

* **Install:** download `lyrics-and-chords.skill` above, then Customize > Skills > + > Upload skill > select the file, and toggle it on
* **Update:** download the new `.skill` and upload it the same way, confirming "Upload and replace"
* **Remove:** Customize > Skills > "..." next to the toggle > Delete

### Claude Code

* **Install:** unzip `lyrics-and-chords.skill` into `~/.claude/skills/`, so that `~/.claude/skills/lyrics-and-chords/SKILL.md` exists
* **Update:** replace the contents of `~/.claude/skills/lyrics-and-chords/` with the new version
* **Remove:** delete the `~/.claude/skills/lyrics-and-chords/` folder

## Licence and source

Lyrics & Chords is free software under the **GNU General Public License, version 2 only** (GPL-2.0-only), because it includes [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) 18.0.0 by Martijn Versluis, which has the same licence. The licence text is in the `.skill` file as `LICENSE`, and `NOTICE.txt` says what is included. The source for this version is the source download above (commit {{commit}}).
