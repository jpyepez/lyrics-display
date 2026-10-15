---
title: Library filter field has no id or name
status: needs-triage
---

Chrome DevTools reports "A form field element should have an id or name attribute (count: 1)" on the Library view. The Filter searchbox in `src/library/LibraryView.tsx` has an `aria-label` but no `name` or `id`, so browser autofill can't identify it.

Seen during browser verification of [lyrics-display-v1 #12]; it predates that ticket.
