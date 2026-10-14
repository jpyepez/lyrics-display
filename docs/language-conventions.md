# Language Conventions

## Layout

- Code is grouped by domain area, not by kind: `src/song/` (Song type, Lyrics parser, Song views), `src/library/` (Library store, Library list), `src/app/` (shell and routing).
- Names follow `CONTEXT.md`: Song, Lyrics, Stanza, Section Label, Library, Screen, Sheet, Fit. Not verse, block, track or page.

## Pure functions vs components

- Logic lives in pure, framework-free modules (`lyrics.ts`, `fit.ts`). Components call them and render the result; no parsing or layout math inside JSX.
- A Song stores its raw Lyrics string; Stanzas are derived by `parseLyrics` at render time, never stored.

## State

- The Library lives in IndexedDB behind `src/library/library.ts`. Components never touch `indexedDB` directly; they call the store's async functions (`addSong`, `getSong`, `listSongs`, `updateSong`, `deleteSong`, `restoreSong`). The Library's own rules live there too: the title sort in `listSongs` and the filter match in `matchesFilter`.
- App-wide settings live in localStorage behind `src/app/settings.ts` (`usePaperSetting`, `savePaperSetting`); components never touch `localStorage` directly.
- No global state library. Each view loads what it needs from the Library store in an effect and keeps it in local state; app-wide settings are the exception above, read while rendering.
- Navigation is the URL hash (`#/`, `#/paste`, `#/settings`, `#/song/<id>`, `#/song/<id>/edit`) via `useRoute()` and `routes` in `src/app/route.ts`, so a reload reopens the same view. Build links with `routes`, never by hand; `navigate` only accepts a `RouteHash`, which only `routes` produces.

## TypeScript

- `erasableSyntaxOnly` is on: no `enum`, no namespaces, no constructor parameter properties. Use string-literal unions and plain objects.
- `type` over `interface`. Use `import type` for type-only imports (`verbatimModuleSyntax`).
- Named exports only; no default exports in `src`.

## React

- Function components, React 19. The app runs under `StrictMode`, so effects must be safe to run twice.
- Forms read values with `FormData` on submit rather than one `useState` per field, unless a field needs live validation.
- Text that must keep its spacing (Lyrics lines) gets `white-space: pre-wrap`.
