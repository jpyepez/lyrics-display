# Git Workflow

Solo personal project. Every change reaches `main` through a pull request: a `main` ruleset requires one, with the CI `checks` job green, and no one can skip it. Merging to `main` deploys to Cloudflare once CI passes.

## Commit format

Conventional commits: `<type>(<scope>): <subject>`. Older commits predate this and stay as they are.

Types:

- `feat`: new feature or visible change
- `fix`: bug fix
- `refactor`: internal change with no behaviour shift
- `docs`: documentation only
- `chore`: tooling, build config, dependencies

Scopes, by the part of the app touched (terms from `GLOSSARY.md`):

- `library`: the Library list, the Library filter, adding and deleting Songs
- `lyrics`: Lyrics, Stanzas, Section Labels and Notes; pasting and editing a Song
- `search`: Lyrics search and LRCLIB calls
- `display`: the Screen, Fit, Spill, Overrides, theme and settings
- `print`: Sheets and print CSS
- `storage`: device-local storage, the Library file and Backups
- `pwa`: offline, install, the service worker and screen wake lock
- `ci`: GitHub workflows, `.github/agents.yml` and deploy
- `docs`: docs that span several parts

Dependency updates are `chore(deps)`. A change that spans several scopes takes the main one, or none: `refactor: …`.

Subject is imperative, lowercase, no trailing period. Keep it under about 60 characters.

```text
feat(display): fit two columns on a wide screen
fix(search): show the busy state on an LRCLIB 503
chore(deps): bump vite to 8.1
docs(ci): describe the github-agents callers
```

PR titles use the same format: with squash merges, the PR title becomes the commit on `main`.

Never put a closing keyword (`close`, `fix` or `resolve`, any tense) before `#<n>` in a commit message: it closes that issue on merge. A `fix(scope): …` type is fine; only a keyword followed by `#<n>` closes anything. Write "issue 42" instead; `Closes #42` goes only in the PR description (see "Commit references" in `docs/agents/issue-tracker.md`).

## Branching

- `main` is the only long-lived branch. Don't commit to it directly.
- One short-lived branch per piece of work, named by type: `feat/<name>`, `fix/<name>`, `docs/<name>`, `chore/<name>`. Worktree branches (for example from dmux) are fine as they are.
- `auto/issue-<n>` for a bot working on issue `<n>`. The Implement workflow finds a bot's PR by this branch name. Bot PR titles use the same format as everyone else's.

## Pull requests

- Open a PR to `main` for every change. Keep it to one coherent change; split unrelated work into separate PRs.
- The description says what changed and why, plus a short test plan, then `Closes #<n>` on a line of its own for each ticket it finishes.
- Browser verification closes every ticket and bug fix (`docs/browser-verification.md`).
- Squash merge, then delete the branch.

## What gets committed

- `GLOSSARY.md`, `docs/adr/` and `docs/out-of-scope/`: committed, since project decisions live with the code.
- Specs and tickets: not committed; they are GitHub issues (see `docs/agents/issue-tracker.md`).
- Test fixtures, seed data and screenshots: invented placeholder lyrics only, never real song lyrics.
- `dist/`, `node_modules/`, Playwright output and agent worktrees (`.claude/worktrees/`): gitignored.
