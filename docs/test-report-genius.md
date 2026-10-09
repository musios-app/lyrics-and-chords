# Test report: lyrics from a Genius page

9 Oct 2026 · @Andrew

## Question

Can the skill parse lyrics taken from genius.com, if a user asks it to?

## Method

- One song page, chosen by Andrew (a copyrighted song, so no lyric text is quoted or stored here).
- The page was fetched and passed through in memory; nothing was written to disk. Only counts and line shapes (words replaced by `w`) were printed.
- The lyric container text was extracted from the page (a throwaway script, not part of the skill), then given to `scripts/parse.mjs` as text, the way a user might paste it.
- Fidelity check: the lyric lines in the source text compared, in order, with the lyric text rebuilt from the parser's JSON.
- Not tested: giving the skill the raw saved HTML page. The skill has no HTML reader yet (see `SKILL.md`), so the expected result is a poor parse.

## Results

| Check | Result |
|---|---|
| Format detected | Ultimate Guitar style (because of `[Chorus]`-type headers) |
| Parse error | None |
| Lyric lines: source vs parser | 55 and 55 |
| Lines identical, in order | 55 of 55, including spacing |
| Words identical overall | Yes |
| Bracketed headers found on the page | 10 |
| Headers turned into sections | Chorus (3), Verse 2, Verse 3, Bridge: yes |
| `[Post-Chorus]` (3) | Kept only as a comment, not as a section |
| `[Outro]` | Became a generic `start_of_part` section |
| `[Verse 1]` | Missed (see below) |
| Page clutter | One junk line passed through as a lyric |

## Findings

1. **Lyric text is preserved exactly.** Every lyric line came through word for word. This is the main result for the skill's rule that lyrics must not change.
2. **Page clutter is not handled.** The first block of text on the page is a single line holding a contributor count, a list of translation languages, a description blurb and the first header (`[Verse 1]`), all run together. The parser read it as a lyric line, and the Verse 1 header was lost inside it. A user who copies the whole page would get the same result. This is the job for the Claude half (spot and remove non-lyric text) or for a Genius-specific rule in our script.
3. **Section names are understood unevenly.** The library knows verse, chorus and bridge. Post-Chorus and Outro come out as a comment or a generic part. Our layer needs its own section codes (Post, Outro).
4. **Parenthetical lines** (backing vocals, such as a few words in brackets) stay inside the lyric text. This matches the plan to treat them as annotations, but nothing separates them yet.
5. **Performer names in headers** (Genius often writes `[Verse 1: Name]`) did not occur on this page, so that case is untested.

## Structured data on the page

Checked after the first run (same page, streamed, nothing stored).

- **No JSON-LD**, and no link to a public JSON file or API on the page.
- **Meta tags** (`og:title`, `og:type` = `music.song`, `og:description`, `description`, `og:url`, canonical link, image links): title and artist only, plus a short description. The description tag also carries the first line of the lyrics.
- **Embedded JSON** in `window.__PRELOADED_STATE__` (one script of about 105 KB). It holds:
  - **Song facts (keep):** title, artist names, writer and producer artists (as ids resolved in an `artists` table), album, release date, language, recording location, explicit and instrumental flags, performance credits (`customPerformances`), YouTube, Spotify and Apple Music ids.
  - **Site data (ignore):** page views, "hot" score, contributor, comment, annotation and "pyongs" counts, ad targeting (`dfpKv`), tracking data, share messages, images, verification flags, the viewer's own permissions, translation links, related songs.
  - **No BPM or key** on this page.
  - **The lyrics themselves**, as a tree of nodes (`lyricsData.body`).
- **The embedded lyrics are clean.** They have 11 header lines, including `[Verse 1]`, and no contributor, translation or description clutter. The page text I extracted for the first run had the clutter and had lost `[Verse 1]`. So a Genius reader that uses the embedded data would avoid finding 2.
- The Genius site also has an official API (not tested here).

## Second run: three public domain songs

Three more Genius pages (older, out-of-copyright songs), same method: streamed, nothing stored, counts and shapes only. Each was tested twice, once with the visible page text and once with the lyrics from the embedded JSON.

| Song page | Lyric lines | Headers | Parser result, both sources |
|---|---|---|---|
| The Darktown Strutters' Ball | 9 | none | All 9 lines identical |
| Alabama Jubilee | 26 | none | All 26 lines identical |
| Because | 12 | none | All 12 lines identical |

- **Lyrics are exact again** (47 of 47 lines), from either source.
- **Clutter again in the visible text:** in each page the first lyric line carries a prefix of page text (a contributor count) that the embedded JSON does not have. It is one line per page, but it changes the first lyric line, so a checker comparing against the writer's text would flag it.
- **No headers on any of the three.** The lyrics are plain blocks separated by blank lines, so the parser found no sections. Labelling verse and chorus would be the Claude half's job.
- **Metadata from the embedded data:** title, artist and album were present on all three. Writers were present on two (none on the Darktown page). Release date was empty on all three. Language was `en` on all. No BPM or key field on any page.
- **Parser format:** all six runs were read as chords-over-words, because there were no chords, brackets or directives. This is a default, not a real match.

## Conclusion

For pasted Genius text, the skill reads the lyrics accurately but misses structure that the page clutter hides. The skill does not yet read a saved Genius HTML page. Both gaps are expected to be closed by the planned layers: Claude labelling lines and removing clutter, and our script grouping sections and keeping the lyric text unchanged.

## Next tests

- The same page saved as HTML (needs an HTML reader first).
- A Genius page with performer names in the headers.
- A Genius page with the full contributor and translation clutter included, to see how often it hides a header.
- Repeat with the labelling step in place, and compare.
