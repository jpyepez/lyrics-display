---
title: One wide line keeps a Song in one column, and the Override can't add columns
status: done
---

Found in a browser QA walk (1280×800, Chrome). A searched Song whose widest line is about 640px at the 20px minimum Fits in one column and Spills onto 2 Screens, while the right half of the Screen stays empty. At 1600px wide the same Song Fits on one Screen in 2 columns at 24px.

The Columns "+" button is disabled too, so the user can't fix it by hand. `src/song/SongView.tsx` caps the Override's `maxColumnCount` at `readableColumnCount`, the most columns where every line fits unwrapped.

That conflicts with:
- the spec, user story 39: "increase or decrease the font size or column count for one Song, so that I can adjust a Song that does not look right."
- `docs/architecture.md`: "A fixed column count is used even where it is not readable: lines wrap rather than the Override being ignored."

Real Lyrics often have one long line, so on a typical laptop many Songs Spill early. Two questions to settle: should the Override allow columns beyond the readable count (wrapping lines), and should the automatic Fit tolerate a few wrapped lines before it Spills?

## Comments

Fixed: the Override may now ask for up to one column per Stanza (or the readable count, if more), lines wrapping; and before Spilling, the automatic Fit tries one more column than is readable. At 1280×800 the Song that showed this now fits one Screen in two columns.
