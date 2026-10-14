---
title: Lyrics Display v1
status: ready
---

# Lyrics Display v1

## Problem Statement

When I play guitar I want the lyrics of a song in front of me, readable at a glance, without fighting the screen or the printer. Today that means opening a lyrics website: the lyrics come in one long narrow column with ads and navigation around them, so on a desktop most of the screen is wasted and I have to scroll with my hands busy. On a phone it is worse. When I print the same page, the browser adds the date, the URL and page numbers at the top and bottom, the page breaks fall in the middle of a verse, and one song often ends up on two or three sheets with leftover website clutter.

I also have nowhere to keep the songs I play. Every time, I search again, and I cannot fix a wrong line or mark where the chorus is.

## Solution

A small web app, installable on desktop and phone, that keeps my own Library of Songs and shows any Song in a layout built for playing.

I add a Song by searching for it by title and artist, or by pasting the Lyrics. It is saved and opened at once. On a desktop the Song is laid out to Fit the whole screen: Stanzas flow into as many columns as needed, and the font shrinks only as far as it stays readable from my playing position. A Stanza is never split across columns. If the Song still does not fit, it Spills onto a second Screen that I reach with a tap, a key, or a Bluetooth page-turner pedal. The screen stays awake while a Song is open. On a phone the same rules apply at a phone's size, with large text.

When I print, I get one clean Sheet per Song: title and artist at the top, the Lyrics in columns below, no browser date, URL or page numbers, and no Stanza cut in half. A Song only Spills to a second Sheet when it cannot fit one Sheet at the minimum print size, and then the Sheets are marked 1/2 and 2/2.

The Library lives on the device. I can export it to a file and import that file on another device or as a backup.

## User Stories

### Adding Songs

1. As a guitarist, I want to search for a Song by title and artist, so that I can get its Lyrics without copying them from a website.
2. As a guitarist, I want search results to show the title, artist and album of each match, so that I can pick the right version.
3. As a guitarist, I want picking a search result to save the Song and open it straight away, so that I can start playing in one step.
4. As a guitarist, I want to paste Lyrics with a title and artist, so that I can add any Song that search cannot find.
5. As a guitarist, I want the app to take me to paste when search finds nothing, so that I am never stuck.
6. As a guitarist, I want a result that LRCLIB marks as instrumental to take me to paste instead of creating an empty Song, so that my Library has no blank Songs.
7. As a guitarist, I want a clear message when search is unavailable (offline, rate-limited or failing), so that I know to paste instead.
8. As a guitarist, I want adding a Song that is already in my Library (same title and artist) to open the existing Song, so that I do not get duplicates.
9. As a guitarist, I want the title and artist comparison for duplicates to ignore case and surrounding spaces, so that small typing differences do not create copies.

### Editing Songs

10. As a guitarist, I want to edit a Song's title, artist and Lyrics, so that I can fix mistakes from the search source.
11. As a guitarist, I want to add a Section Label such as `[Chorus]` or `[Verse 2]` on its own line at the start of a Stanza, so that I can see the structure while playing.
12. As a guitarist, I want Section Labels shown as small headings above their Stanza, so that they stand out from the Lyrics.
13. As a guitarist, I want blank lines in my Lyrics to separate Stanzas, so that the structure comes from how I write the text.
14. As a guitarist, I want several blank lines in a row treated as one Stanza break, so that messy pasted text still works.
15. As a guitarist, I want the Lyrics shown exactly as written, with no repeats collapsed or reordered, so that what I see is what I typed.
16. As a guitarist, I want to add a private Note to a Song (for example "capo 2, slow intro"), so that I remember how I play it.
17. As a guitarist, I want the Note shown in the app but never printed, so that my Sheets stay clean.
18. As a guitarist, I want editing to be one tap away from a Song, so that quick fixes are easy.

### Library

19. As a guitarist, I want to see all Songs in my Library as one list, so that I can find what I want to play.
20. As a guitarist, I want to filter the Library by typing part of a title or artist, so that I can find a Song quickly.
21. As a guitarist, I want the Library sorted by title, so that the list is predictable.
22. As a guitarist, I want to delete a Song and get an Undo option for a few seconds, so that a wrong tap is easy to reverse.
23. As a guitarist, I want my Library still there when I come back, so that I do not search again every time.
24. As a guitarist, I want the app to ask the browser to keep my Library permanently, so that it is less likely to be cleared automatically.
25. As a guitarist, I want to export my whole Library to a file, so that I have a backup.
26. As a guitarist, I want to import a Library file, so that I can move my Songs to another device.
27. As a guitarist, I want importing to add new Songs and skip duplicates (same title and artist), so that importing twice does no harm.
28. As a guitarist, I want to be told how many Songs were added and how many were skipped after an import, so that I know what happened.
29. As a guitarist, I want an invalid file to be rejected with a clear message and no change to my Library, so that a bad import cannot damage it.
30. As a guitarist, I want the Library to work offline, so that I can play at a place with no signal.

### Playing on a desktop

31. As a guitarist, I want a Song laid out to Fit my whole screen, so that I can read it without scrolling.
32. As a guitarist, I want Stanzas to flow into more columns before the font gets smaller, so that the text stays as large as possible.
33. As a guitarist, I want the font never to go below a minimum readable size on screen, so that I can always read it from where I sit.
34. As a guitarist, I want a Stanza never split across columns or Screens, so that I can read each Stanza at a glance.
35. As a guitarist, I want a Song that cannot Fit one Screen at the minimum size to Spill onto further Screens, so that nothing gets unreadably small.
36. As a guitarist, I want to know which Screen I am on and how many there are, so that I know how much of the Song is left.
37. As a guitarist, I want to go to the next or previous Screen with the keyboard (arrow keys, Page Up/Page Down, space), so that a Bluetooth page-turner pedal works.
38. As a guitarist, I want the layout to Fit again when I resize the window, so that it always uses the space I have.
39. As a guitarist, I want to increase or decrease the font size or column count for one Song, so that I can adjust a Song that does not look right.
40. As a guitarist, I want that Override remembered for that Song, so that I set it only once.
41. As a guitarist, I want a "reset to auto" option, so that I can go back to the automatic Fit.
42. As a guitarist, I want the title and artist shown small at the top of the Song, so that the Lyrics get most of the space.
43. As a guitarist, I want the Song's Note shown in a small, unobtrusive place, so that it helps without taking space from the Lyrics.

### Playing on a phone

44. As a guitarist, I want a Song on my phone to Fit the phone screen with large text, so that I can read it on a stand or my lap.
45. As a guitarist, I want to tap the right side of the screen for the next Screen and the left side for the previous one, so that I can turn with one quick touch.
46. As a guitarist, I want the screen to stay awake while a Song is open, so that it does not go dark mid-song.
47. As a guitarist, I want the screen to stay awake again after I switch apps and come back, so that I do not have to reopen the Song.
48. As a guitarist, I want the Song to Fit again when I rotate the phone, so that landscape gives me more columns.
49. As a guitarist, I want to install the app on my phone's home screen, so that it opens like an app and keeps my Library more reliably.

### Printing

50. As a guitarist, I want to print a Song with no browser date, URL or page numbers on the Sheet, so that it looks clean on a music stand.
51. As a guitarist, I want each Song to Fit one Sheet whenever it can, so that I have one page per Song.
52. As a guitarist, I want the print layout to use more columns, then a smaller font down to a minimum print size (about 10pt), before Spilling to a second Sheet, so that one Sheet is preferred but text stays readable.
53. As a guitarist, I want a Stanza never split across columns or Sheets, so that the printout reads as cleanly as the screen.
54. As a guitarist, I want the title and artist at the top of the Sheet and nothing else besides the Lyrics, so that the Sheet has no clutter.
55. As a guitarist, I want "1/2" and "2/2" on the Sheets only when a Song Spills, so that I can keep the pages in order.
56. As a guitarist, I want A4 portrait by default, so that it matches my paper.
57. As a guitarist, I want to choose Letter or landscape, so that I can print on other paper or get more columns.
58. As a guitarist, I want my Screen Overrides ignored when printing, so that the Sheet always gets its own best Fit.
59. As a guitarist, I want printing to work from the browser's normal Print command as well as from a Print button in the app, so that I do not need to remember a special step.

### Look and feel

60. As a guitarist, I want the app to follow my system's light or dark setting, so that it suits a dim room.
61. As a guitarist, I want a manual light/dark toggle that is remembered, so that I can override the system setting.
62. As a guitarist, I want one clear, readable font, so that the Lyrics are easy to read from a distance.
63. As a guitarist, I want printing to always use dark text on white, so that dark mode does not waste ink.

## Implementation Decisions

- **Platform.** A static single-page app built with Vite, React and TypeScript, packaged as a PWA with a service worker so that the app shell works offline. bun is the package manager. There is no backend.
- **Modules.**
  - **Song model and Lyrics parser.** Turns a Song's raw Lyrics into an ordered list of Stanzas, each with an optional Section Label and its lines. A Stanza break is one or more blank lines. A line in square brackets that starts a Stanza is its Section Label. Lines keep their text as written (trailing whitespace trimmed).
  - **Fit engine.** A pure function and the core of the app. Inputs: the parsed Stanzas, the target surface (width, height, and whether it is a Screen or a Sheet), the minimum font size for that surface, an optional Override, and a text measurer. Output: the font size, the column count, and the Stanzas placed column by column on one or more Screens or Sheets. Fallback order: try the largest font with one column; add columns while the column width stays readable; reduce the font down to the minimum; only then Spill. A Stanza is never split across columns or surfaces. A single Stanza taller than a whole column at the minimum font is the one exception: it may break between lines, and only at that point. The text measurer is injected, so the app uses real font metrics and tests use a fake.
  - **Library store.** Saves Songs (id, title, artist, Lyrics, Note, Override, created/updated times) in IndexedDB. It offers list, get, add (with the duplicate rule), update, delete and restore (for Undo), export and import. Duplicate rule: same title and artist after trimming and ignoring case. On first use it requests persistent storage.
  - **Library file format.** A JSON document with a format version and the list of Songs. Import checks the version and shape before writing anything.
  - **Lyrics search client.** Calls LRCLIB's search endpoint from the browser (it allows cross-origin requests). Uses the plain lyrics field, flags instrumental results, and maps network errors, rate limits (respecting `retry-after`) and empty results to distinct states.
  - **Song view (Screen).** Measures the viewport, runs the Fit engine, shows the current Screen, handles navigation (tap zones, keys), keeps the screen awake with the Wake Lock API (requesting it again when the tab becomes visible), and applies and edits the Override.
  - **Print view (Sheet).** Print styles set the page margin to zero, which leaves the browser no room for its own headers and footers. The Sheet's white space is padding inside each page. The Fit engine runs for the chosen paper size and orientation, with the print minimum font (about 10pt). It renders one page per Sheet, with forced page breaks between Sheets, and always black on white.
  - **Shell.** Library list with filter, add (search or paste), edit form, settings (theme, paper size, orientation), export/import, and the Undo toast.
- **Minimum font sizes.** About 18–20px for a desktop Screen, a size readable at arm's length for a phone Screen, and about 10pt for a Sheet. These are settings of the Fit engine's inputs, not per-Song data.
- **Overrides** are stored on the Song and apply to Screens only. Sheets always use the automatic Fit.
- **Paper settings** (A4 or Letter; portrait or landscape) are app-wide, stored on the device, and default to A4 portrait.
- **Theme** follows the system's preference, with a manual override stored on the device.

## Testing Decisions

- **A good test checks behaviour the user or a calling module can observe** (what is shown, what is saved, which Stanzas land on which Screen or Sheet), never internal state or component structure. Tests use invented placeholder lyrics, never real song lyrics.
- **Seam 1: the whole app in a real browser (Playwright),** with LRCLIB requests stubbed at the network layer. It covers: adding by search and by paste, the duplicate rule, instrumental and no-result paths, edit, delete with Undo, persistence across reloads, export then import (including an invalid file), Screen navigation by key and tap, Override and reset, refitting on resize, and print. For print it switches the page to print media and renders a PDF, then checks the number of Sheets (one for a short Song, two with "1/2"/"2/2" for a long one) and that the Note is absent. The browser's own print-dialog headers and footers cannot be observed from a test; checking them is a manual step before release.
- **Seam 2: the Fit engine on its own,** with a predictable fake text measurer. It covers: the fallback order (columns before shrinking, shrinking before Spilling), a Stanza never split, the oversized-Stanza exception, Override handling, the minimum font being respected, and Screen and Sheet inputs giving different results for the same Song.
- **Prior art:** none. The repo is new; these two suites set the patterns for later work.

## Out of Scope

- Importing lyrics from a lyrics-website URL (see `.out-of-scope/url-import.md`).
- Chords, chord diagrams, ChordPro, tabs or any notation other than plain lyrics.
- Setlists (ordered groups of Songs). Postponed, not rejected.
- Auto-scroll. Postponed, not rejected.
- Accounts, a server, or syncing the Library between devices other than through export/import.
- Generating a PDF inside the app. Revisit only if print styles prove not to be enough.
- Collapsing repeated Stanzas (for example "Chorus ×2").
- A font picker.
- Synced (time-stamped) lyrics, even though LRCLIB provides them.

## Further Notes

- Firefox may still print its own headers and footers even with zero page margins, unless the user unticks the option in its print dialog once. Check this during the manual print check, and if it holds, show a short hint in the app's print settings for Firefox users.
- Safari can clear stored data for sites not visited for a week unless the app is installed to the home screen. The persistent-storage request, home-screen install and export/import together cover this, so the app should encourage exporting now and then.
- Glossary terms used in this spec are defined in `CONTEXT.md`.
