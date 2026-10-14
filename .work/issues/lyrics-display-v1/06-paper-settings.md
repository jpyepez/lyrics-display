---
slice: 6
title: Paper settings
status: done
blocked_by: [5]
parent_prd: lyrics-display-v1
---

**What to build:** a settings screen where the user picks A4 or Letter, portrait or landscape. The choice is app-wide, stored on the device, defaults to A4 portrait, and the print Fit uses it (landscape gives more columns). If the manual check in the print ticket showed Firefox still prints its own headers/footers, show a short hint for Firefox users here.

- [x] Paper size and orientation selectable and remembered on the device
- [x] Default is A4 portrait
- [x] Printed Sheets match the chosen size and orientation
- [x] Firefox hint shown if needed
- [x] Playwright test covers a non-default paper setting

## Comments

- 2026-10-15: Firefox couldn't be checked in #05 (no Firefox at hand). The user decided to show the Firefox hint anyway, to Firefox users only: it does no harm if Firefox turns out fine, and it's easy to remove after a real check.
- Done in d6e880d and the review follow-up. Settings (from the Library, `#/settings`) picks A4/Letter and portrait/landscape, stored in localStorage via `src/app/settings.ts`. `e2e/paper-settings.spec.ts` checks the PDF paper size for A4 portrait (default), Letter landscape (also remembered across reload), Letter portrait and A4 landscape, and that landscape gives the first Sheet more columns.
- Firefox hint is shown to Firefox user agents only, still unverified against a real Firefox, per the decision above. `docs/gotchas.md` says to drop it if a real check shows Firefox prints clean. Firefox on iOS (`FxiOS`) doesn't get it; it prints through WebKit.
