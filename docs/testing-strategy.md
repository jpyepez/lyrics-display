# Testing Strategy

Tests check behaviour a user or a calling module can observe: what is shown, what is saved, which Stanzas land on which Screen or Sheet. Never internal state or component structure.

## Seams

Tests live at two seams only (agreed in the v1 spec). Ask before adding a third.

1. **Pure modules (Vitest).** The Lyrics parser (`src/song/lyrics.ts`), the Library filter (`src/library/libraryFilter.ts`), the argument and column lookup of the board script (`scripts/board-status.ts`), the Triage outcome check (`scripts/triage-outcome.ts`) and the Fit engine (`src/song/fit.ts`), the Fit engine with an injected fake text measurer whose sizes are simple enough to work out by hand (see `fit.test.ts`). Call the exported function, assert on its return value.
2. **The whole app in a real browser (Playwright, `e2e/`).** Drive it the way a user does: roles, labels, visible text. Each test gets a fresh browser context, so IndexedDB starts empty.

The Library store and React components have no tests of their own; the Playwright suite covers them (paste → view → reload proves the store persists).

## Commands

- `bun run test`: all unit tests. `bunx vitest run src/song/lyrics.test.ts` for one file.
- `bun run test:e2e`: Playwright. It builds the app and serves it with `vite preview` on port 4173 (reused if already running). `bunx playwright test e2e/paste-song.spec.ts` for one file.
- `bun run typecheck`: `tsc -b`, covers `src`, `e2e` and the configs.
- CI (`.github/workflows/ci.yml`) runs actionlint (with shellcheck), lint, typecheck, unit tests, build and e2e on every PR and push to `main`.

## Conventions

- Unit tests sit next to the module: `foo.ts` → `foo.test.ts`. Vitest only picks up `src/**/*.test.ts` and `scripts/**/*.test.ts`; Playwright files are `e2e/*.spec.ts`.
- Expected values are literals written out by hand, never recomputed the way the code does.
- Fixtures are invented placeholder lyrics, never real songs (they are copyrighted and get committed).
- Playwright's text matchers (`toHaveText`, `getByText`) collapse whitespace. To check that Lyrics are shown exactly as written, read `innerText` of the `lyric-line` test ids instead.
- `data-testid` only where no role or label identifies the element (lyric lines).
- Print: `page.pdf({ preferCSSPageSize: true })` renders print media at the Sheet's own page size (the default is Letter). To go back after `emulateMedia({ media: 'print' })`, pass `media: null`: emulated `'screen'` reaches the PDF too.
- The Sheets are in the DOM on screen, only hidden, and text locators match hidden elements. Scope a text locator to `getByRole('main')` when the Sheet repeats that text (title, artist).

## What to skip

- Live LRCLIB calls: stub them at the network layer with `page.route` in Playwright; unit tests never hit the network.
- The browser's own print headers and footers can't be observed from a test; that check is manual before release.
