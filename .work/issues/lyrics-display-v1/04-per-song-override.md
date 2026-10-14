---
slice: 4
title: Per-Song Override
status: done
blocked_by: [3]
parent_prd: lyrics-display-v1
---

**What to build:** in the Song view the user can increase or decrease the font size or column count for one Song. The Override is saved on the Song and used every time it's opened on a Screen; "reset to auto" clears it and goes back to the automatic Fit. Overrides never affect Sheets.

- [x] Font size and column count controls in the Song view
- [x] Override saved on the Song and still applied after a reload
- [x] "Reset to auto" restores the automatic Fit
- [x] Engine tests cover Override handling (including an Override that causes Spill)
- [x] Playwright test covers set Override → reload → reset
