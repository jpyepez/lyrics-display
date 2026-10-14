---
slice: 9
title: Lyrics search, and the duplicate rule
status: ready
blocked_by: [1]
parent_prd: lyrics-display-v1
---

**What to build:** the user searches by title and artist; the app calls LRCLIB's search endpoint from the browser (CORS allowed) and lists matches with title, artist and album. Picking one saves the Song with its plain lyrics and opens it. No results or an instrumental result send the user to paste instead of creating an empty Song. Offline, rate-limited (respecting `retry-after`, no blind retries) and failing searches each show a clear message pointing to paste. Adding a Song that already exists (same title and artist, ignoring case and surrounding spaces), by search or by paste, opens the existing Song instead of creating a duplicate.

- [ ] Search results show title, artist and album
- [ ] Picking a result saves and opens the Song
- [ ] No result and instrumental result go to paste
- [ ] Offline, rate limit and error each have a distinct message
- [ ] Duplicate add (search or paste) opens the existing Song
- [ ] Playwright tests stub LRCLIB at the network layer; no live calls in tests
