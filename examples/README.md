# Examples

One invented lyric, "Ballad of Lorem Ipsum", written five ways. Each file is an input the skill reads. Run any of them from the repo folder; the results below come from real runs. The words are placeholder text, free to use.

| File | What it shows | Command | Result |
|---|---|---|---|
| `1-pasted-text.txt` | Text pasted as it comes: a title line, then stanzas with no labels | `cat examples/1-pasted-text.txt \| node scripts/load.mjs -` | Loads, but finds **no sections**: the stanzas are just lyric lines. The title is a lyric line too. Status `needs-info` (title, credits, date missing). |
| `2-bracket-headers.txt` | `[Verse 1]` style headers, no chords | `node scripts/load.mjs examples/2-bracket-headers.txt` | **6 sections**: Verse 1 (4 lines), Chorus (4), Verse 2 (4), Bridge (4), Chorus (1), Outro (1). |
| `3-labels-without-brackets.txt` | Section labels written plainly (`Verse 1`, `Chorus`) | `node scripts/load.mjs examples/3-labels-without-brackets.txt` | The same **6 sections**. A note says 6 labels were read as headers. |
| `4-chordpro.cho` | ChordPro: `{title:}`, `{key:}`, `{start_of_verse:}` and inline `[Am]chords` | `node scripts/load.mjs examples/4-chordpro.cho` | **6 sections, 16 chords**. The title and key are facts, so only credits and date are missing. `{comment: repeat}` is a `comment` tag, so the second chorus has no lyric lines. |
| `5-chords-above-words.txt` | Chords on the line above the words, with `[Header]` lines (chords in Verse 1 and the first chorus) | `node scripts/load.mjs examples/5-chords-above-words.txt` | The same **6 sections, 16 chords**, each chord attached to its word by column. |

Things to notice:

- The first example is why section labels matter: with none, the skill cannot tell where a verse or chorus starts. Claude would ask the writer, or the writer adds labels.
- In the title line, the examples all leave "Ballad of Lorem Ipsum" as a lyric line (except ChordPro, where `{title:}` is a fact). To make it a fact, give it with `--facts` and set the line aside with `--set-aside 1`, as the download page shows.
- `(repeat)` in examples 2, 3 and 5 stays a lyric line. The skill does not interpret repeat marks.

All five are checked by `npm test`.

`7-genius-page.txt` is separate: the lyrics of an old song that is out of copyright ("Because"), as copied from a Genius.com page, with the page's own text above the lyrics. Load it with `--set-aside 1,2` and the title and credits as `--facts`. It is not part of `npm test`.

`8-ultimate-guitar-page.txt` is the chords and lyrics of a traditional song (out of copyright) as shown on an Ultimate Guitar chords page: chords above the words, no section headers. Load it with the title, artist and tempo as `--facts`. It is not part of `npm test`.
