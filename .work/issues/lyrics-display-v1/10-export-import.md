---
slice: 10
title: Export and import the Library
status: ready
blocked_by: [9]
parent_prd: lyrics-display-v1
---

**What to build:** the user exports the whole Library to a JSON file with a format version and the list of Songs, and imports such a file on another device. Import checks version and shape before writing anything; it adds new Songs and skips duplicates using the duplicate rule, then reports how many were added and skipped. An invalid file is rejected with a clear message and the Library is unchanged. Because browser storage can be evicted (notably Safari), the app gently encourages exporting now and then.

- [ ] Export downloads a versioned JSON file of all Songs (including Notes and Overrides)
- [ ] Import adds new Songs, skips duplicates, reports added/skipped counts
- [ ] Importing the same file twice changes nothing the second time
- [ ] Invalid file rejected with a message; Library untouched
- [ ] Occasional nudge to export
- [ ] Playwright test covers export → import, and an invalid file
