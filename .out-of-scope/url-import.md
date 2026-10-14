# URL Import

The app does not import lyrics by pasting a link to a lyrics website. Songs come in by pasting the lyrics or by Lyrics search (LRCLIB).

## Why this is out of scope

The app is static, with no backend. Lyrics websites do not allow cross-origin requests, so a browser cannot fetch their pages directly. Importing from a URL would need a server-side proxy, and that one feature would be the only reason the project has a server to host and maintain.

Even with a proxy, scraping is fragile. Each site needs its own extraction rules, and those rules break silently whenever the site changes its markup. Most lyrics sites also forbid scraping in their terms of use.

Paste and search already cover the need. Search fills in most songs in a few keystrokes, and paste works for any song search can't find, including ones copied from the same websites a URL import would target.

## Prior requests

- Initial design discussion (2026-10-14): considered and dropped in favour of paste + LRCLIB search.
