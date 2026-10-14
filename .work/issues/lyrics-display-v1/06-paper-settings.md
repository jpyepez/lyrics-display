---
slice: 6
title: Paper settings
status: ready
blocked_by: [5]
parent_prd: lyrics-display-v1
---

**What to build:** a settings screen where the user picks A4 or Letter, portrait or landscape. The choice is app-wide, stored on the device, defaults to A4 portrait, and the print Fit uses it (landscape gives more columns). If the manual check in the print ticket showed Firefox still prints its own headers/footers, show a short hint for Firefox users here.

- [ ] Paper size and orientation selectable and remembered on the device
- [ ] Default is A4 portrait
- [ ] Printed Sheets match the chosen size and orientation
- [ ] Firefox hint shown if needed
- [ ] Playwright test covers a non-default paper setting

## Comments

- 2026-10-15: Firefox couldn't be checked in #05 (no Firefox at hand). The user decided to show the Firefox hint anyway, to Firefox users only: it does no harm if Firefox turns out fine, and it's easy to remove after a real check.
