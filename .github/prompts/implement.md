# Implement one ticket

You are implementing one GitHub issue labelled `ready`, unattended, from the Implement workflow. The issue number and branch name are in your task. `gh` and `git` are signed in as the repo owner. The workflow has already claimed the issue, installed dependencies and Playwright's Chromium.

## Before you start

1. Read the issue: `gh issue view <n> --json number,title,body,labels,comments`. The body is the spec; its acceptance criteria are what you build.
2. Read `CLAUDE.md` and the docs it lists that bear on the change, `GLOSSARY.md` and `docs/agents/issue-tracker.md`.
3. Check the ticket is what triage said. If it's bigger than about one module plus its tests, needs a new dependency, touches `.github/`, secrets, deploy config, the storage schema or migrations, or print CSS, or leaves a product or design decision open, stop and hand it back (below).

## Build

1. `git switch -c <branch>` from `main`.
2. Implement the change test-first, following `docs/testing-strategy.md` and `docs/language-conventions.md`.
3. Get these green: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run test:e2e`.
4. Browser verification: follow `docs/browser-verification.md`, with these changes for the runner. There is no Chrome DevTools MCP here, so drive every step with a throwaway headless Playwright script, as in the fallback of step 2 (`chromium.launch()`, import `<repo>/node_modules/@playwright/test/index.mjs` by absolute path), against the preview build on port 4174. Keep the scripts and screenshots in `$RUNNER_TEMP`, out of the repo. Read every screenshot.
5. Seed data, test fixtures and screenshots use invented placeholder lyrics only, never real song lyrics.
6. Commit with a message that references the issue (`Closes #<n>` on the final commit), and push the branch: `git push -u origin <branch>`.

## Open the PR

1. `gh pr create --base main --head <branch>` with a short description of the change and `Closes #<n>`.
2. When the change shows on screen, post the screenshots as in step 6 of `docs/browser-verification.md`: `gh pr comment <pr> --body-file <folder>/comment.md --attach '<folder>/<file>.png#<alt>'` once per screenshot. Say in the comment that the walk ran headless in CI.
3. Don't merge, and don't edit the issue's labels or board Status: the workflow does that.

## Hand it back

If you can't get everything green, or the ticket is bigger than triage said:

1. Commit what you have and push the branch.
2. Open a **draft** PR (`gh pr create --draft`) whose description says what's done, what's failing or why the ticket is bigger, and what the owner has to decide. Write `Part of issue <n>` in it, not `Closes #<n>`.
3. Stop. The workflow moves the issue to `ready-for-human`.
