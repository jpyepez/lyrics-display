# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues. Use the `gh` CLI for all operations.

## Conventions

- **Create an issue**: `gh issue create --title "..." --body "..."`. Use a heredoc for multi-line bodies.
- **Read an issue**: `gh issue view <number> --json number,title,body,labels,comments`.
- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with appropriate `--label` and `--state` filters.
- **Edit an issue body**: write the whole new body to a file, then `gh issue edit <number> --body-file <file>`. Never pass `-` or an empty body.
- **Comment on an issue**: `gh issue comment <number> --body "..."`
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`
- **Close**: see "When a skill says close or resolve a ticket" below.

Infer the repo from `git remote -v`; `gh` does this automatically when run inside a clone.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests; `/triage-issues` reads this flag.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr` equivalents:

- **Read a PR**: `gh pr view <number> --comments` and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh pr list --state open --json number,title,body,labels,author,authorAssociation,comments` then keep only `authorAssociation` of `CONTRIBUTOR`, `FIRST_TIME_CONTRIBUTOR`, or `NONE` (drop `OWNER`/`MEMBER`/`COLLABORATOR`).
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either: resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create a GitHub issue.

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue** above.

## When a skill says "close" or "resolve" a ticket

A merged PR closes the ticket. Open a PR to `main` with `Closes #<n>` in the description for each ticket it finishes; the issue stays open until that PR merges, even when the work is finished on a branch.

Work that ships no code (wontfix, duplicates, pathfinder resolves, a parent spec whose sub-issues are all closed) closes directly: `gh issue close <number> --comment "..."`. The Triage workflow is the exception: it only recommends `wontfix`, and the owner closes the issue as not planned.

## Commit references

Reference the issue as `#<number>` in the commit message (e.g. `Closes #42` on the final commit).

`closes`, `fixes` or `resolves` followed by `#<n>` anywhere in a PR description closes that issue when the PR merges, even mid-sentence. To mention an issue without closing it, write the number without the `#` ("see issue 42").

## Repo conventions

- **Labels**: the triage roles use the strings in `triage-labels.md`. A closed issue is done; there is no `done` label.
- **A spec is a parent issue.** The issue body is the spec, labelled `spec` and `ready`. The `spec` label keeps the Implement workflow from building the parent before its tickets are attached. Its tickets are GitHub sub-issues of it, added in dependency order (blockers first): `gh api --method POST repos/<owner>/<repo>/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>`, where `<child-db-id>` is the child's numeric database id (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`). Blocking between tickets uses native issue dependencies, as described under Wayfinding below.
- **Promote, don't duplicate.** When a spec comes out of an existing issue (usually an inbox item after triage), replace that issue's body with the spec instead of opening a new issue. First post the original body as a comment headed `Original note:` so it stays readable (below the AI-triage disclaimer line, when the Triage workflow writes it). Retitle the issue if the scope changed.
- **PRs close tickets**: see "When a skill says close or resolve a ticket" above.
- **Claim before working**: before implementing an issue, assign it with `gh issue edit <n> --add-assignee @me` and set its board Status to In progress (below).
- **Board**: the [lyrics-display project](https://github.com/users/jpyepez/projects/3) is one board with a column per Status: Inbox, HITL, Ready, In progress, Done. GitHub's built-in workflows add new issues to Inbox and move closed issues to Done. HITL holds what waits on the owner; Ready holds only what a bot may build. Keep Status in step with the triage label whenever you change one:

  | Change | Status |
  | --- | --- |
  | `needs-triage` applied | Inbox (`549ca079`) |
  | `needs-info`, `ready-for-human` or `wontfix` applied | HITL (`bc2c8ae3`) |
  | `ready` applied | Ready (`d1c6b124`) |
  | Issue claimed | In progress (`37a6af55`) |

  Set it with `scripts/board-status.sh <n> <Inbox|HITL|Ready|In progress>`, which adds the issue to the board first if it isn't there. It runs these two commands:

  ```sh
  item=$(gh project item-add 3 --owner jpyepez --url https://github.com/jpyepez/lyrics-display/issues/<n> --format json --jq .id)
  gh project item-edit --project-id PVT_kwHOAJXAFM4BpG0W --id "$item" --field-id PVTSSF_lAHOAJXAFM4BpG0Wzhnj5Ps --single-select-option-id <option-id>
  ```
- **Not issues**: glossary, ADRs and out-of-scope records stay as files (see `domain.md`).

## Automation

Two GitHub Actions workflows act on issues the owner opens. Issues opened by anyone else run neither.

- **Triage** (`.github/workflows/triage.yml`, prompt `.github/prompts/triage.md`) runs when the owner opens an issue, or by hand from the Actions tab with an issue number (`gh workflow run triage.yml -f issue=<n>`). It skips issues labelled `notes`, `spec` or `pathfinder:*`, and an issue opened with an outcome label already on it, such as a ticket filed as `ready`. It leaves the issue with one category label, one outcome (`ready`, `needs-info`, `ready-for-human`, or `wontfix` recommended with the issue still open) and a comment giving its reasons, promotes a spec into the body for `ready`, and sets the board Status from the table above. The run fails if the labels don't come out that way. The `ready` bar is in `triage-labels.md`. Nothing re-runs triage: relabel by hand or dispatch it again.
- **Implement** (`.github/workflows/implement.yml`, prompt `.github/prompts/implement.md`) runs when the owner labels an issue `ready`; labels Triage applies count, since it acts as the owner. It skips spec parents (labelled `spec`, or with sub-issues) and runs one at a time: a second `ready` waits for the running one, and a third replaces the waiting one, so relabel it once the queue clears. It claims the issue, builds it on `auto/issue-<n>`, runs lint, typecheck, unit tests, e2e and a headless browser verification, and opens a PR with `Closes #<n>` and a screenshot comment. A run that can't get green, finds the ticket bigger than triage said, runs out of turns or time, or crashes ends in a draft PR when there is a branch, with the issue relabelled `ready-for-human` and moved to HITL. Labelling it `ready` again carries on from that branch and draft PR.

Nothing merges automatically, and Deploy only runs on `main`, so nothing ships until the owner merges.

Both workflows act through `OWNER_PAT`, a classic PAT of the owner's with the scopes `repo`, `project` and `read:org`, and not `workflow`, so the bots can't edit their own workflows. A fine-grained PAT can't reach a user-owned Project, and `gh project` needs `read:org` to tell a user owner from an organization ("unknown owner type" without it). `GITHUB_TOKEN` won't do: the events it causes don't start other workflows, so `ready` would never start Implement and CI wouldn't run on bot PRs, and it can't edit a user-owned Project. Claude runs on `CLAUDE_CODE_OAUTH_TOKEN`. `--max-turns` (30 for triage, 80 for implement) and `timeout-minutes` cap each run.

## Wayfinding operations

Used by `/pathfinder`. The **map** is a single issue with **child** issues as tickets. Issues labelled `pathfinder:*` are planning, not requests: `/triage-issues` skips them.

- **Map**: a single issue labelled `pathfinder:map`, holding the Notes / Decisions-so-far / Fog body. `gh issue create --label pathfinder:map`.
- **Child ticket**: an issue linked to the map as a GitHub sub-issue (`gh api` on the sub-issues endpoint). Where sub-issues aren't enabled, add the child to a task list in the map body and put `Part of #<map>` at the top of the child body. Labels: `pathfinder:<type>` (`research`/`prototype`/`grilling`/`task`). Once claimed, the ticket is assigned to the driving dev.
- **Blocking**: GitHub's **native issue dependencies**, the canonical, UI-visible representation. Add an edge with `gh api --method POST repos/<owner>/<repo>/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric **database id** (`gh api repos/<owner>/<repo>/issues/<n> --jq .id`, _not_ the `#number` or `node_id`). GitHub reports `issue_dependencies_summary.blocked_by` (open blockers only, the live gate). Where dependencies aren't available, fall back to a `Blocked by: #<n>, #<n>` line at the top of the child body. A ticket is unblocked when every blocker is closed.
- **Frontier query**: list the map's open children (`gh issue list --state open`, scoped to the map's sub-issues / task list), drop any with an open blocker (`issue_dependencies_summary.blocked_by > 0`, or an open issue in the `Blocked by` line) or an assignee; first in map order wins.
- **Claim**: `gh issue edit <n> --add-assignee @me`, the session's first write.
- **Resolve**: `gh issue comment <n> --body "<answer>"`, then `gh issue close <n>`, then append a context pointer (gist + link) to the map's Decisions-so-far.
