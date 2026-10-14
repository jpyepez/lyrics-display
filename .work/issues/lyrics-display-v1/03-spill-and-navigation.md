---
slice: 3
title: Spill and Screen navigation
status: ready
blocked_by: [2]
parent_prd: lyrics-display-v1
---

**What to build:** when a Song can't Fit one Screen at the minimum font, it Spills onto further Screens, still never splitting a Stanza. The one exception: a single Stanza taller than a whole column at the minimum font may break between lines, at that point only. The Song view shows which Screen the user is on and how many there are, and moves between Screens by keyboard (arrow keys, Page Up/Page Down, space, so a Bluetooth page-turner pedal works) and by tapping the right side (next) or left side (previous).

- [ ] Engine tests cover: shrinking before Spilling, no Stanza split across Screens, the oversized-Stanza exception
- [ ] Screen indicator ("x/y") shown when a Song Spills
- [ ] Next/previous by arrow keys, Page Up/Down and space
- [ ] Next/previous by tapping the right/left side
- [ ] Playwright tests cover key and tap navigation on a long Song

## Comments

- From #02: two stopgaps hold the place of Spill and should be replaced, not extended. In `src/song/fit.ts`, a Song that cannot fit at the minimum font fills the readable columns and the last one takes the rest (`lastTakesRest`). In `src/index.css`, `.screen` has `overflow-y: auto` so that last column can scroll.
