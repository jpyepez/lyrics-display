---
slice: 5
title: Print a Song (A4 portrait)
status: done
blocked_by: [3]
parent_prd: lyrics-display-v1
---

**What to build:** printing a Song gives clean Sheets. Print styles set the page margin to zero (leaving the browser no room for its date/URL/page-number headers and footers) and put the Sheet's white space in padding inside the page. The Fit engine runs for A4 portrait with a print minimum of about 10pt: more columns, then smaller font, and only then Spill to another Sheet, never splitting a Stanza. Each Sheet has title and artist at the top and nothing but Lyrics below; "1/2", "2/2" only when the Song Spills. Screen Overrides are ignored, the Note is never printed, and print is always black on white. Works from an in-app Print button and from the browser's own Print command.

- [x] Short Song prints as one Sheet; long Song as two Sheets marked 1/2 and 2/2
- [x] No Stanza split across columns or Sheets
- [x] Title and artist at the top; Note absent
- [x] Screen Override has no effect on the Sheet
- [x] Print button and browser Print both produce the Sheet layout
- [x] Playwright test renders print media to PDF and checks Sheet count and Note absence
- [ ] Manual check: Chrome/Edge print dialog shows no browser headers/footers; Firefox behaviour recorded

## Comments

- Done in 7bca8ec and the review follow-up. Fit for A4 portrait from 10pt to 24pt; the header's measured height comes off the Sheet, and a long title wraps.
- Note absence: the Song has no Note until #07. `e2e/print.spec.ts` checks that print media shows exactly the title, the artist and the Lyrics, so a Note that leaks into print will fail it. #07 should add a Note to that test's Song.
- Manual check still open: the Chrome/Edge print dialog headers/footers and Firefox behaviour need a person at the print dialog. #06 needs the Firefox result for its hint. The headless Chromium PDFs show no headers or footers, at A4 size.
