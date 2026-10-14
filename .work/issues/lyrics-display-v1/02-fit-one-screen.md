---
slice: 2
title: Fit a Song to one Screen
status: ready
blocked_by: [1]
parent_prd: lyrics-display-v1
---

**What to build:** the Fit engine, a pure function taking the parsed Stanzas, the surface (width, height, Screen or Sheet), the minimum font size and an injected text measurer, and returning font size, column count and Stanzas placed by column. The Song view uses it with real font metrics so a Song fills the whole Screen: largest font in one column first, then more columns while column width stays readable, then a smaller font down to the Screen minimum (about 18–20px on desktop, arm's-length readable on a phone). A Stanza is never split across columns. Title and artist are shown small at the top.

- [ ] Engine unit tests with a predictable fake measurer cover: columns before shrinking, minimum font respected, Stanza never split, Screen vs Sheet inputs giving different results
- [ ] Song view lays out the Song in columns to fill the viewport without scrolling
- [ ] Song fits again on window resize and on phone rotation
- [ ] Title and artist shown small at the top
- [ ] Playwright test checks refit on resize
