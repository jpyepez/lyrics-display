# lyrics-display
A static PWA (Vite + React + TypeScript) for showing song lyrics while playing guitar: paste or search lyrics into a device-local library, auto-fit them into columns on screen, and print one clean song per sheet.

## Commands
- Package manager is bun: `bun install`, `bun run <script>`, `bunx <tool>`.

## Rules
- Test fixtures, seed data and screenshots use invented placeholder lyrics, never real song lyrics: they are copyrighted and get committed.
- **Browser verification** closes every ticket and bug fix, before committing and opening its PR, and leaves a screenshot comment on the PR when the change shows on screen: follow [the steps](./docs/browser-verification.md).

## Deep Context
IMPORTANT: Before starting a task, identify which of these files are relevant and read them.
- [Architecture](./docs/architecture.md): read before adding a module, touching storage, search, the fit/layout engine, or print.
- [Gotchas](./docs/gotchas.md): read before working on print CSS, browser storage, LRCLIB calls, or screen wake lock.
- [Testing strategy](./docs/testing-strategy.md): read before writing or changing tests.
- [Language conventions](./docs/language-conventions.md): read before writing TypeScript or React code.

## Agent skills

### Issue tracker

Issues and specs are GitHub issues, managed with `gh`, on the [lyrics-display board](https://github.com/users/jpyepez/projects/3). A spec is a parent issue with its tickets as sub-issues. A merged PR with `Closes #<n>` closes a code ticket; `gh issue close` is only for work that ships no code. See `docs/agents/issue-tracker.md`.

Active specs are issues labelled `ready` that have sub-issues: read the relevant one (`gh issue view <n> --json number,title,body,labels,comments`) before implementing a feature. Finished specs and tickets from before the move to GitHub: `docs/archive.md`.

### Triage labels

The five default triage labels, with `ready-for-agent` written as `ready`. See `docs/agents/triage-labels.md`.

### Domain docs

Glossary in `GLOSSARY.md`, ADRs in `docs/adr/`, out-of-scope records in `docs/out-of-scope/`; all writable. See `docs/agents/domain.md`.

### Notes

Running notes and rough ideas are GitHub issues: label `notes` for running notes, `needs-triage` for an idea to sort later. There is no `.work/` folder.
