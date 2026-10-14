---
slice: 1
title: Set up the app; paste a Song and see it
status: done
blocked_by: []
parent_prd: lyrics-display-v1
---

**What to build:** the first end-to-end path. A static Vite + React + TypeScript PWA project (bun), with Vitest and Playwright wired up. The user pastes a title, artist and Lyrics; the Song is saved to the Library in IndexedDB, appears in a plain Library list, and opens in a single-column Song view. Lyrics are parsed into Stanzas (one or more blank lines is one break); a `[Label]` line that starts a Stanza is its Section Label, shown as a small heading. Lines keep their text as written (trailing whitespace trimmed). The Library survives a reload.

This is the first code in the repo, so it also sets the patterns for later tickets: fill in the testing-strategy and language-conventions docs.

- [x] Project builds and runs with bun; unit test and Playwright commands exist and pass
- [x] Pasting title, artist and Lyrics saves the Song and opens it
- [x] Stanzas split on blank lines; several blank lines in a row make one break
- [x] Section Labels at the start of a Stanza render as small headings above it
- [x] Lyrics shown exactly as written, nothing collapsed or reordered
- [x] Saved Songs are listed in the Library and still there after a reload
- [x] Parser has unit tests; a Playwright test covers paste → view → reload
- [x] Testing-strategy and language-conventions docs filled in
- [x] All fixtures use invented placeholder lyrics
