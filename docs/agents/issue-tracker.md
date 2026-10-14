# Issue tracker: Local Markdown

Issues and specs for this repo live as markdown files in `.work/`.

## Conventions

- One spec per feature: `.work/prds/<feature-slug>.md`
- Tickets are one file per ticket at `.work/issues/<feature-slug>/<NN>-<slug>.md`, numbered from `01` in dependency order, never a single combined tickets file. Frontmatter:

  ```yaml
  ---
  slice: 2
  title: Tuesday 2× multiplier
  status: ready
  blocked_by: [1]
  parent_prd: <feature-slug>
  ---
  ```
- Incoming work (bug reports, rough ideas) waits in `.work/issues/inbox/<slug>.md`, with `title` and `status` frontmatter
- State is the frontmatter `status`, using the strings in `triage-labels.md`, plus `in-progress` and `done` for work under way and finished. A file without `status` (QA script, README) is not an issue
- Blocking: `blocked_by` lists ticket numbers in the same folder; a ticket is unblocked when every one is `done`
- `.work/maps/` holds pathfinder maps, not issues: other skills ignore it
- Comments and conversation history append to the bottom of the file under a `## Comments` heading
- Commits reference a ticket as `[<feature-slug> #<NN>]`, or `[<folder> <slug>]` for one without a spec (e.g. `[inbox login-timeout]`)

## When a skill says "publish to the issue tracker"

Create a new file in the matching place above, creating the directory if needed.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path directly.

## When a skill says "close" or "resolve" a ticket

Set its `status` to `done`, or `wontfix` with the reason as a comment.

## Wayfinding operations

Used by `/pathfinder`. The **map** is a file with one **child** file per ticket, kept apart from `.work/issues/` so decision tickets never reach `implement-ticket`.

- **Map**: `.work/maps/<effort>/map.md` (the Destination / Notes / Decisions-so-far / Fog body), with `title` frontmatter. The user refers to a map by this path or its `<effort>` folder.
- **Child ticket**: `.work/maps/<effort>/NN-<slug>.md`, numbered from `01`, with the question in the body. Frontmatter: `title`, `type` (`research`/`prototype`/`grilling`/`task`), `status`, `blocked_by`.
- **Status**: `open` until claimed (never `ready`, which marks work for agents), `in-progress` once claimed, `done` when resolved, `wontfix` when ruled out of scope.
- **Blocking**: `blocked_by` lists ticket numbers in the same folder. A ticket is unblocked when every one is `done`.
- **Frontier**: scan `.work/maps/<effort>/` for tickets that are `open` and unblocked; first by number wins.
- **Claim**: set `status: in-progress` and save before any work.
- **Resolve**: append the answer under an `## Answer` heading, set `status: done`, then append a context pointer (gist + relative link to the ticket file) to the map's Decisions-so-far in `map.md`.
