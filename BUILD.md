# Building and publishing Lyrics & Chords

```
npm install            # once: fetches ChordSheetJS and the bundler
npm test               # the tests (invented lyrics only)
python3 build.py       # builds dist/lyrics-and-chords.skill
```

The build checks `SKILL.md` against the Agent Skills rules, bundles ChordSheetJS into one file so the skill needs no `npm install`, copies the scripts, writes `NOTICE.txt`, zips the folder, and then runs the packaged scripts from a folder outside this repo as a test. `dist/` is generated: never edit it by hand.

The same build also writes the ChatGPT plugin into your clone of `musios-app/musios-ai-plugins` (`--plugins PATH`, default `~/Dropbox/code/musios-app/musios-ai-plugins`), the repository the ChatGPT app adds with "Add plugin marketplace":

- `plugins/lyrics-and-chords/` there holds the plugin: `.codex-plugin/plugin.json` and a copy of the built skill in `skills/`. It is generated: never edit it by hand.
- `.agents/plugins/marketplace.json` there lists the plugins (this one and the Songwriting Coach). It is edited by hand in that repository; the build does not touch it.

The build never touches git. Commit and push `musios-ai-plugins` yourself with every release (the ChatGPT app installs from that repository, not from `dist/`).

The package needs only Node.js 18 or later (ChatGPT uses the Node.js inside its app). To install it:
- **ChatGPT desktop app:** see the install panel on the web page, or add this repository as a plugin marketplace.
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
