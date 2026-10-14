# Lyrics Display

Showing song lyrics to read while playing guitar, on screen and on paper.

## Songs

**Song**:
A piece saved in the Library: a title, an artist, its Lyrics and an optional Note.
_Avoid_: Track, tune

**Lyrics**:
The words of a Song exactly as written, made up of Stanzas.
_Avoid_: Text, words

**Stanza**:
A run of consecutive lyric lines, separated from the next by a blank line.
_Avoid_: Verse (a verse is one kind of Stanza), block, paragraph

**Section Label**:
An optional heading the user gives a Stanza, such as "Chorus" or "Verse 2".
_Avoid_: Tag, marker

**Note**:
Private free text on a Song, shown in the app and never printed.
_Avoid_: Comment, annotation

**Library**:
All the Songs saved on one device.
_Avoid_: Collection, catalog, songbook

**Library file**:
The whole Library exported as one JSON file with a format version, to import on another device or after the browser clears its storage.
_Avoid_: Backup file, dump

**Backup**:
Exporting a Library file. The Library nudges for one when it has had none for a week.
_Avoid_: Reminder, sync

## Display

**Screen**:
One screenful of a Song while playing; the next Screen is reached by tap or pedal.
_Avoid_: Page, view

**Sheet**:
One printed page of a Song.
_Avoid_: Page, printout

**Fit**:
The arrangement of a Song's Stanzas into columns at one font size, for a given Screen or Sheet.
_Avoid_: Layout, flow

**Spill**:
When a Song needs more than one Screen or Sheet, even at the minimum font size.
_Avoid_: Overflow

**Override**:
A per-Song font size or column count that replaces the automatic Fit on Screens.
_Avoid_: Preference, setting

## Code terms

"View" is fine in code and specs for a UI component (Song view, Library view, Print view). In the domain language, a screenful of a Song is still a Screen, never a view.
