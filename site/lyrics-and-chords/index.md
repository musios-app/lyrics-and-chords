---
layout: default
title: "Lyrics & Chords"
description: Loads song lyric and chord files and returns a JSON object, for Claude.
sitemap: false
noindex: true
---

# Lyrics & Chords

Lyrics & Chords loads a song's lyric or chord file, reads it, repairs what the readers get wrong, checks that no word or chord was lost, and returns a JSON object: the song with its facts and sections, plus anything it could not resolve. It runs entirely on your own computer and makes no network requests.

It is a helper for other skills, such as the [Songwriting Coach](../songwriting-coach/), and is useful on its own when you want a lyric or chord file in a predictable form.

Version {{version}}, a first release.

## What it reads

* **ChordPro** files (`.cho`, `.chordpro`, `.pro`), with `{directives}` and inline `[Am]chords`
* **Chords above words**, as plain text
* **Text with `[Verse 1]` style headers**, with or without chords. A header can name a performer: `[Verse 1: Name]`.
* **Section labels without brackets**, such as `V1`, `VERSE 1` or `Chorus`
* **Word files** (`.docx`): the paragraph text only. Comments, deleted text and formatting are ignored.
* **Pasted text**

Fixes made along the way include chord lines the underlying library cannot read exactly (`G(maj7)`, `Em7(♭5)/D`, `| Emaj7| Emaj7 |`), sections that run across blank lines, and padding spaces on chords.

**Not supported yet:** Nashville numbers, chord charts with no lyrics (bars and section labels only), and chord lines that have a word in them (`Intro | Gm79 | C7`). A file the skill cannot read fails with a plain message that names the line. It never returns a song with a lost word or chord.

## What it returns

One JSON object. The words in this example are invented.

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

## Download

| Platform | Download |
|---|---|
| Claude (claude.ai, desktop app, Claude Code) | [lyrics-and-chords.skill](downloads/lyrics-and-chords.skill) (v{{version}}) |
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
