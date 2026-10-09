// Lyrics & Chords: shared test for "does this text look like a chord name?".
// Used by parse.mjs and check.mjs so both agree. Accepts D, Am7, Gmaj7/D, Em7(♭5)/D,
// Gminmaj79, F#m, Bb/D. The letters after the root come from a closed list, so
// ordinary words such as "And" or "Feel" are not mistaken for chords.
const QUALITY = "(?:maj|min|dim|aug|sus|add|alt|m|M|[0-9]|[#b♭♯+\\-()])*";
export const CHORD = new RegExp(`^[A-G][#b♭♯]?${QUALITY}(?:\\/[A-G][#b♭♯]?${QUALITY})?$`);
