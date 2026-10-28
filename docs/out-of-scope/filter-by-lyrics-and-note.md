# Filtering by Lyrics and Note

The Library filter matches a Song's title and artist only. It does not look inside the Lyrics or the Note.

## Why this is out of scope

A Song reaches the Library after the player has already found and read its Lyrics somewhere else, so they look a Song up by its title or artist, not by a line from it. Matching the Lyrics would mostly add noise: a short query turns up in the Lyrics of many Songs, and a list of titles gives no clue why a Song matched unless every result also shows a snippet.

The Note is private free text for the player's own reminders. It is not how a Song is identified, so it stays out of the filter for the same reason.

## Prior requests

- #3: considered while scoping fuzzy matching for the Library filter (2026-10-29), and dropped in favour of matching title and artist only.
