---
slice: 10
title: Export and import the Library
status: done
blocked_by: [9]
parent_prd: lyrics-display-v1
---

**What to build:** the user exports the whole Library to a JSON file with a format version and the list of Songs, and imports such a file on another device. Import checks version and shape before writing anything; it adds new Songs and skips duplicates using the duplicate rule, then reports how many were added and skipped. An invalid file is rejected with a clear message and the Library is unchanged. Because browser storage can be evicted (notably Safari), the app gently encourages exporting now and then.

- [x] Export downloads a versioned JSON file of all Songs (including Notes and Overrides)
- [x] Import adds new Songs, skips duplicates, reports added/skipped counts
- [x] Importing the same file twice changes nothing the second time
- [x] Invalid file rejected with a message; Library untouched
- [x] Occasional nudge to export
- [x] Playwright test covers export → import, and an invalid file

## Comments

- Import rejects a Song with a blank title, artist or Lyrics, as paste does, since the duplicate rule depends on them. Imported Songs get fresh ids; Notes, Overrides and times are kept.
- The nudge shows on the Library when it has Songs and there has been no export (or "Not now") for 7 days, Safari's eviction window. The last-Backup time lives in localStorage, outside the Library file.
- Outside this ticket: the Library filter box (#08) has no `name`, which Chrome reports as a form-field issue in the console.
