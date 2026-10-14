# Architecture

- **Static, no backend.** The app ships as static files plus a service worker (PWA, works offline). Anything that would need a server is out of scope unless a decision record says otherwise.
- **Lyrics search** calls the LRCLIB API (`https://lrclib.net/api/search`) straight from the browser. Paste is the fallback for every case search can't cover (no result, instrumental, wrong lyrics).
- **Library** lives in browser storage on each device; there are no accounts and no sync. Export/import of a library file is the backup and the only cross-device path.
- **One fit engine** lays out a Song for both a Screen and a Sheet. It never splits a Stanza; its fallback order is more columns → smaller font down to a minimum → spill to another Screen/Sheet. Screen and Sheet differ only in their inputs (dimensions, minimum font size).
- **Per-song display overrides** (size, columns) apply to Screens only; Sheets always auto-fit.
