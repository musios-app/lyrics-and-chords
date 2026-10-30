<!--[page]-->
---
layout: default
title: "Lyrics & Chords Skill"
description: Beta. A skill for Claude and ChatGPT that reads song lyrics and chord sheets in many formats (ChordPro, Genius and Ultimate Guitar pages, plain text, chords above words, Word files), corrects many common errors, and returns a plain reading plus structured JSON. Works with the Songwriting Coach. Free software under the GPL.
tagline: "BETA: Reads a wide range of song lyrics and chord file formats into Claude or ChatGPT."
icon: images/icon.svg
gitrepo: https://github.com/musios-app/lyrics-and-chords
software:
  categories: [Music, Songwriting, Lyrics and chord sheets]
  version: "{{version}}"
  download: /projects/lyrics-and-chords/downloads/lyrics-and-chords.skill
  license: https://spdx.org/licenses/GPL-2.0-only.html
  repo: https://github.com/musios-app/lyrics-and-chords
---

## Lyrics & Chords Skill for Claude and ChatGPT <span class="badge text-bg-warning ms-3">BETA</span> {#lyrics--chords-skill}

<!--[/page]-->
<!--[readme]-->
# Lyrics & Chords skill (Beta)

<!--[/readme]-->
The Lyrics & Chords skill lets Claude and ChatGPT read the song sheets you already have, in many formats (ChordPro, Ultimate Guitar or Genius pages, plain text, chords above words, Word files). It finds the sections, keeps chords and lyrics aligned, and corrects common formatting errors. It is for songwriters, performers and music teachers who want to bring their charts into AI without worrying about formats and conversions.

It may also be useful for developers who want songs as structured JSON data. It returns a plain reading and a structured JSON version, so the song can be reused, converted or passed to other tools. Your lyrics and chords go only to the Claude or ChatGPT chat you're already using.

Contact [lyrics-and-chords@musios.app](mailto:lyrics-and-chords@musios.app) for bugs, suggestions, and feedback.

<!--[readme]-->
Slug: `lyrics-and-chords`. Licence: GPL-2.0-only (see `LICENSE`).

A skill that loads song lyric and chord files (plain lyrics, chords above words, inline chords, ChordPro, Word files, pasted text), repairs what the readers get wrong, checks that no word or chord was lost, and returns a JSON object: the song with its facts and sections, plus anything it could not resolve. It runs entirely locally and makes no network requests. It is built on ChordSheetJS. The skill's page on musios.app has the download, install steps and examples: https://musios.app/projects/lyrics-and-chords/

Design notes: [docs/design-notes.md](docs/design-notes.md).

<!--[/readme]-->

## Formats<!--[page]--> {#formats}<!--[/page]-->

The skill reads a wide range of lyric and chord formats. It can identify and correct many (not all) common errors.

* [ChordPro](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-chordpro.html) - with thanks to [Martijn Versluis](https://github.com/martijnversluis) for the [ChordSheetJS](https://github.com/martijnversluis/ChordSheetJS) library
* [Genius.com](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-genius.html)
* [Ultimate Guitar](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-ultimate-guitar.html)
* [Bracket format](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-bracket-format.html)
* [Unbracketed format](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-unbracketed-format.html)
* [Plain text](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-plain-text.html)
* [Chords above words](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-chords-above-words.html)
* [Word documents](<!--[page]-->examples/<!--[/page]--><!--[readme]-->https://musios.app/projects/lyrics-and-chords/examples/<!--[/readme]-->example-word-documents.html)

<!--[page]-->
<style>
  .gs-start { position: relative; border: 1px solid #e8e6dc; border-radius: 24px; background: #f8f8fa; padding: 10px 14px 6px; margin: 2rem 0 2rem; clear: both; }
  .gs-note { color: #5d5a55; font-size: .85rem; margin-top: .6rem; padding-top: .5rem; border-top: 1px solid #e8e6dc; }
  .gs-steps { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 6px 0 6px; padding: 0; list-style: none; }
  .gs-intro { display: flex; flex-direction: row; align-items: center; gap: 10px; padding: 10px 0 8px; }
  .gs-intro > div { line-height: 1.25; }
  .gs-title { display: block; color: var(--gs-text, #b83eaa); font-weight: 700; font-size: 1.1em; line-height: 1.25; }
  .gs-dl-table th, .gs-dl-table td { padding: .35rem .75rem !important; }
  .gs-dl { color: var(--gs-text, #b83eaa) !important; font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
  .gs-dl:hover { color: var(--gs-hover, #9d3490) !important; text-decoration: underline; }
  .gs-steps li { background: #fff; border: 1px solid #e8e6dc; border-radius: 14px; padding: 8px 11px; }
  .gs-icon { display: none; flex: none; width: 40px; height: 40px; } /* logos hidden for now: delete display:none to show them */
  .gs-n { display: inline-flex; width: 26px; height: 26px; border-radius: 50%; background: var(--gs-accent, #b83eaa); color: #fff; font-weight: 700; font-size: .85rem; align-items: center; justify-content: center; margin-right: .5rem; }
  .gs-claude, .gs-chatgpt { border-color: rgba(var(--gs-rgb), .55); border-width: 1px; }
  .gs-claude .gs-steps li, .gs-chatgpt .gs-steps li { border-color: rgba(var(--gs-rgb), .4); border-width: 1px; }
  .gs-claude { --gs-accent: #d97757; --gs-rgb: 217, 119, 87; --gs-text: #b85c3e; --gs-hover: #9a4a30; }
  .gs-chatgpt { --gs-accent: #74aa9c; --gs-rgb: 116, 170, 156; --gs-text: #4f8b7b; --gs-hover: #3b6e60; }
  .gs-chatgpt code, .gs-claude code { color: var(--gs-text); }
  .gs-copy { display: inline-flex; align-items: center; margin-left: .2rem; padding: 3px; vertical-align: middle; color: var(--gs-text); background: none; border: 0; border-radius: 6px; cursor: pointer; }
  .gs-copy:hover, .gs-copy:focus-visible { background: rgba(var(--gs-rgb), .18); }
  .gs-steps b { display: block; margin-bottom: .45rem; line-height: 1.25; }
  .gs-steps .gs-d { color: #5d5a55; font-size: .92rem; line-height: 1.25; }
  .gs-steps .gs-p { display: block; margin-top: .7rem; }
  .gs-steps .gs-p:first-child { margin-top: 0; }
  @media (max-width: 760px) { .gs-start { padding: 14px 12px 10px; border-radius: 20px; } .gs-steps { grid-template-columns: 1fr; } }
</style>
<script>
document.addEventListener("click", function (event) {
  var button = event.target.closest(".gs-copy");
  if (!button) return;
  var text = button.getAttribute("data-copy");
  var label = button.innerHTML;
  function done() { button.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5L20 7"/></svg>'; setTimeout(function () { button.innerHTML = label; }, 1500); }
  function fallback() {
    var box = document.createElement("textarea");
    box.value = text;
    document.body.appendChild(box);
    box.select();
    try { document.execCommand("copy"); done(); } catch (problem) {}
    document.body.removeChild(box);
  }
  if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
  else fallback();
});
</script>
<div class="gs-start gs-claude">
  <div class="gs-intro">
    <img class="gs-icon" src="images/claude-icon.svg" alt="Claude" width="40" height="40">
    <b class="gs-title">Installation for Claude</b>
  </div>
  <ol class="gs-steps">
    <li><b><span class="gs-n">1</span>Download the file</b>
    <span class="gs-d"><a class="gs-dl" href="downloads/lyrics-and-chords.skill" download>
      Download lyrics-and-chords.skill</a>
    </span></li>
    <li><b><span class="gs-n">2</span>Add the skill to Claude</b><span class="gs-d"><span class="gs-p">Open claude.ai<br/>Or open Claude Desktop app (Mac or Windows)</span><span class="gs-p">Customize &gt; Skills &gt; Add &gt; Upload skill</span><span class="gs-p">Drag and drop the file then Upload</span></span></li>
    <li><b><span class="gs-n">3</span>Load a song</b><span class="gs-d"><span class="gs-p">Open a new Chat or Code session</span><span class="gs-p">Prompt Claude: <code>Load my lyrics</code> <button type="button" class="gs-copy" data-copy="Load my lyrics" aria-label="Copy Load my lyrics" title="Copy"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="9" width="11" height="11" rx="2"/><path d="M9 4h9a2 2 0 0 1 2 2v9"/></svg></button></span><span class="gs-p">Paste your lyrics and/or chords or drop their file</span></span></li>
  </ol>
</div>

<div class="gs-start gs-chatgpt" id="chatgpt-install">
  <div class="gs-intro">
    <img class="gs-icon" src="images/chatgpt-logo.svg" alt="ChatGPT" width="40" height="40">
    <b class="gs-title">Installation for ChatGPT</b>
  </div>
  <ol class="gs-steps">
    <li><b><span class="gs-n">1</span>Add the marketplace</b><span class="gs-d"><span class="gs-p">Open ChatGPT desktop app (Mac or Windows)</span><span class="gs-p">Plugins &gt; Add plugin marketplace</span><span class="gs-p">Source: <code>musios-app/musios-ai-plugins</code> <button type="button" class="gs-copy" data-copy="musios-app/musios-ai-plugins" aria-label="Copy musios-app/musios-ai-plugins" title="Copy"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="9" width="11" height="11" rx="2"/><path d="M9 4h9a2 2 0 0 1 2 2v9"/></svg></button></span><span class="gs-p">Leave the other boxes empty</span><span class="gs-p">Click <i>Add marketplace</i></span></span></li>
    <li><b><span class="gs-n">2</span>Install the plugin</b><span class="gs-d"><span class="gs-p">Plugins &gt; Personal &gt; <i>musios AI</i></span><span class="gs-p">Click <i>Lyrics &amp; Chords</i> then <i>Install</i></span></span></li>
    <li><b><span class="gs-n">3</span>Load a song</b><span class="gs-d"><span class="gs-p">Open a new chat in <b style="display:inline">Work</b> mode (it works only there)</span><span class="gs-p">Prompt ChatGPT: <code>Use the lyrics-and-chords skill to load my lyrics</code> <button type="button" class="gs-copy" data-copy="Use the lyrics-and-chords skill to load my lyrics" aria-label="Copy Use the lyrics-and-chords skill to load my lyrics" title="Copy"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="9" width="11" height="11" rx="2"/><path d="M9 4h9a2 2 0 0 1 2 2v9"/></svg></button></span><span class="gs-p">Paste your lyrics and/or chords or drop their file</span></span></li>
  </ol>
</div>

<!--[/page]-->

## Other features<!--[page]--> {#features}<!--[/page]-->

* For sites with copyrighted content, such as [genius.com](https://genius.com) and [ultimate-guitar.com](https://ultimate-guitar.com), this skill is intended for Educational use only.
* Returns a plain reading plus a JSON object (ChordSheetJS format) that captures the structure in the lyrics (see [Return JSON Object](#return-json-object))
* This skill can be used with other skills, such as the [Songwriting Coach](https://musios.app/projects/songwriting-coach/)
* Source code available<!--[page]--> (see [Source](#source))<!--[/page]--><!--[readme]-->: it is this repository<!--[/readme]-->


## Source<!--[page]--> {#source}<!--[/page]-->

<!--[page]-->
Source code for Lyrics & Chords Skill {{version}}: [lyrics-and-chords-{{version}}-source.zip](downloads/lyrics-and-chords-{{version}}-source.zip)
<!--[/page]-->
<!--[readme]-->
The source code is this repository.
<!--[/readme]-->

<!--[page]-->
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

### ChatGPT desktop app {#chatgpt}

It works only in the desktop app's **Work** mode (plain Chat cannot use skills). It needs no Node.js of your own: it uses the one inside the app.

* **Install:** see the steps above. The plugin is installed from the GitHub repository `musios-app/musios-ai-plugins`
* **Update:** in a ChatGPT Work session, type: *Update my musios AI plugins to the latest versions*
* **Remove:** Plugins > Lyrics & Chords > Manage > Uninstall

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
Building, testing and publishing: see [BUILD.md](BUILD.md).

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
