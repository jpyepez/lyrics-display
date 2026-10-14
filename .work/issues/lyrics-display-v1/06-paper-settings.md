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
