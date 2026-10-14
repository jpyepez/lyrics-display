---
slice: 8
title: "Library list: filter, sort, delete with Undo"
status: done
blocked_by: [1]
parent_prd: lyrics-display-v1
---

**What to build:** the Library shows all Songs sorted by title, with a filter that matches part of a title or artist as the user types. A Song can be deleted; an Undo toast appears for a few seconds and restores it if tapped.

- [x] Library sorted by title
- [x] Typing filters by title or artist
- [x] Delete removes the Song and shows an Undo toast
- [x] Undo restores the Song with all its data (Note, Override)
- [x] Playwright tests cover filter and delete with Undo
