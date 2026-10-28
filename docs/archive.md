# Archive: the `.work/` spec and tickets

Until the move to GitHub issues, specs and their tickets lived as files under
`.work/prds/` and `.work/issues/<spec>/`. Every one of them was done when they were
removed. They're kept at the last commit before the move:

- [`.work/` tree at `b8e3fb2`](https://github.com/jpyepez/lyrics-display/tree/b8e3fb2/.work)
- [Spec](https://github.com/jpyepez/lyrics-display/blob/b8e3fb2/.work/prds/lyrics-display-v1.md): lyrics-display-v1
- [Tickets](https://github.com/jpyepez/lyrics-display/tree/b8e3fb2/.work/issues/lyrics-display-v1), `01` to `12`

Commit messages that cite `[lyrics-display-v1 #NN]` point into that tree: ticket #NN
is `.work/issues/lyrics-display-v1/NN-*.md` there. Ones that cite `[inbox <slug>]`
refer to inbox items, which are now issues #1 (setlists), #2 (auto-scroll) and
#3 (fuzzy-search).

New specs and tickets are GitHub issues; see `docs/agents/issue-tracker.md`.
