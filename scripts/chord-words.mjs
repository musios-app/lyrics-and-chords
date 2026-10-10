// Lyrics & Chords: shared test for "does this text look like a chord name?".
// Used by parse.mjs and check.mjs so both agree. Accepts D, Am7, Gmaj7/D, Em7(♭5)/D,
// Gminmaj79, F#m, Bb/D. The letters after the root come from a closed list, so
// ordinary words such as "And" or "Feel" are not mistaken for chords.
const QUALITY = "(?:maj|min|dim|aug|sus|add|alt|m|M|[0-9]|[#b♭♯+\\-()])*";
// Marks that sit in a chord line besides chords: bar lines, slashes, repeat counts, no-chord.
export const MARK = /^(\||\|\||\/|x|-|N\.C\.|\(?[0-9]+x\)?|\(?x[0-9]+\)?|:\|\|?|\|:)$/;
// The words of a chord line with their columns. A bar mark is a word of its own even when it touches a chord
// ("Emaj7|" is "Emaj7" and "|").
export const chordTokens = (line) => [...line.matchAll(/\|+|[^\s|]+/g)].map((m) => ({ text: m[0], index: m.index }));
export const CHORD = new RegExp(`^[A-G][#b♭♯]?${QUALITY}(?:\\/[A-G][#b♭♯]?${QUALITY})?$`);
