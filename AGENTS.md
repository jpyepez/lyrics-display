# lyrics-display
A static PWA (Vite + React + TypeScript) for showing song lyrics while playing guitar: paste or search lyrics into a device-local library, auto-fit them into columns on screen, and print one clean song per sheet.

## Commands
- Package manager is bun: `bun install`, `bun run <script>`, `bunx <tool>`.

## Rules
- Test fixtures, seed data and screenshots use invented placeholder lyrics, never real song lyrics: they are copyrighted and get committed.

## Deep Context
IMPORTANT: Before starting a task, identify which of these files are relevant and read them.
- [Architecture](./docs/architecture.md): read before adding a module, touching storage, search, the fit/layout engine, or print.
- [Gotchas](./docs/gotchas.md): read before working on print CSS, browser storage, LRCLIB calls, or screen wake lock.
- [Testing strategy](./docs/testing-strategy.md): read before writing or changing tests.
- [Language conventions](./docs/language-conventions.md): read before writing TypeScript or React code.

## Agent skills

### Issue tracker

Issues and specs are local markdown files under `.work/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels, with `ready-for-agent` written as `ready`. See `docs/agents/triage-labels.md`.

### Domain docs

Glossary in `CONTEXT.md`, ADRs in `docs/adr/`, out-of-scope records in `.out-of-scope/`; all writable. See `docs/agents/domain.md`.

### Notes

Scratch notes go in `.work/notes/`.
