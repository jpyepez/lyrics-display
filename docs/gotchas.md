# Gotchas

- **Browser print headers/footers** (date, URL, page numbers) are drawn in the page margin. `@page { margin: 0 }` removes the room for them in Chrome/Edge (checked in Chrome, Oct 2026: the dialog then has no headers/footers option at all); put the Sheet's whitespace in padding inside the page instead. Firefox may still print them unless the user unticks "Print headers and footers" once (unverified; check before claiming it is fixed there).
- **Safari evicts script-written storage** (localStorage, IndexedDB) for sites not visited in 7 days, unless the app is installed to the home screen. Call `navigator.storage.persist()` and keep export/import working; the Library is not durable on its own.
- **LRCLIB allows CORS** (`access-control-allow-origin: *`), so no proxy is needed. It exposes `retry-after` on rate limiting; respect it rather than retrying blindly.
- **Screen wake lock** (`navigator.wakeLock`) is released when the tab is hidden; re-request it on `visibilitychange`.
- **Text width is not linear in font size.** A line measured at 100px and scaled to 36px came out 2–3% narrower than the line rendered at 36px, enough to wrap lines the Fit said would fit. The DOM measurer (`src/song/measure.ts`) lays out each font size for real instead of scaling.
