# Lyrics & Chords: outstanding work

## To build
- [ ] Offer the title, credits and date it finds as candidates, instead of asking for all three. For example: "Is 'Timeless Tonight' the title? Is 'Andrew Hunt' the credit? Is '4 April 2026' the date?" The writer answers yes or no. Never decide silently: anything uncertain becomes a question. The real Timeless Tonight .docx is the test case (its title is the first line, the credit is a "Music & Lyrics:" line, the date is in "Version:"); tests use invented text only. Low priority: asking for the three items is correct today, only slower.

## To test
- [ ] Chord-chart handling (0.1.5) in ChatGPT with the real Timeless Tonight file. First update the plugin there with "Update my Musios plugins to the latest versions", which also tests the update prompt on the page. The Coach session leads this.
- [ ] Whether the ChatGPT plugin needs a paid plan. The page says nothing about a plan.
- [ ] The ChatGPT install on a computer with no Node.js of its own (the skill should use the app's own).

## To keep in mind
- The ChatGPT install depends on the GitHub repository `musios-app/musios-ai-plugins` staying public. `python3 build.py` writes the plugin into your clone of it; commit and push there with every release. See `BUILD.md`.
- Untested: the ChatGPT update prompt now says "musios AI" (it said "Musios" under the old marketplace name).
- GPL-2.0-only: never bundle this skill into the (proprietary) Songwriting Coach `.skill`.
