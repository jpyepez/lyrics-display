import { describe, expect, test } from 'vitest'
import { filterSongs, matchSong, matchWord } from './libraryFilter'

describe('matchWord', () => {
  test('part of a word matches exactly, ignoring case', () => {
    expect(matchWord('ALTZ', 'Candle Waltz')).toBe('exact')
  })

  test('one substituted character matches fuzzily', () => {
    expect(matchWord('wamtz', 'Candle Waltz')).toBe('fuzzy')
  })

  test('one inserted character matches fuzzily', () => {
    expect(matchWord('candlle', 'Candle Waltz')).toBe('fuzzy')
  })

  test('one deleted character matches fuzzily', () => {
    expect(matchWord('cndle', 'Candle Waltz')).toBe('fuzzy')
  })

  test('two swapped neighbouring characters match fuzzily', () => {
    expect(matchWord('wlatz', 'Candle Waltz')).toBe('fuzzy')
  })

  test('a word of 3 characters or fewer only matches exactly', () => {
    expect(matchWord('cnd', 'Candle Waltz')).toBeUndefined()
    expect(matchWord('and', 'Candle Waltz')).toBe('exact')
  })

  test('a word of 4 to 7 characters matches with one edit, not two', () => {
    expect(matchWord('meadw', 'Meadow Song')).toBe('fuzzy')
    expect(matchWord('mdaw', 'Meadow Song')).toBeUndefined()
  })

  test('a word of 8 characters or more matches with two edits', () => {
    expect(matchWord('placholdrs', 'The Placeholders')).toBe('fuzzy')
  })

  test('a typo in the start of a longer word matches fuzzily', () => {
    expect(matchWord('candk', 'Candle Waltz')).toBe('fuzzy')
  })

  test('accents are ignored both ways', () => {
    expect(matchWord('cafe', 'Café Lantern')).toBe('exact')
    expect(matchWord('café', 'Cafe Lantern')).toBe('exact')
  })

  test('punctuation inside a word is ignored both ways', () => {
    expect(matchWord('standins', 'The Stand-ins')).toBe('exact')
    expect(matchWord('stand-ins', 'The Stand-ins')).toBe('exact')
    expect(matchWord('dont', "Don't Wait")).toBe('exact')
  })

  test('a word too far off does not match', () => {
    expect(matchWord('wxltq', 'Candle Waltz')).toBeUndefined()
    expect(matchWord('plcholdrs', 'The Placeholders')).toBeUndefined()
  })
})

describe('matchSong', () => {
  const song = { title: 'Meadow Song', artist: 'The Placeholders' }

  test('every typed word must match the title or artist, in any order', () => {
    expect(matchSong(song, 'song meadow')).toBe('exact')
    expect(matchSong(song, 'meadow placeholders')).toBe('exact')
    expect(matchSong(song, 'meadow waltz')).toBeUndefined()
  })

  test('one fuzzy word makes the whole match fuzzy', () => {
    expect(matchSong(song, 'meadow placholders')).toBe('fuzzy')
  })

  test('an empty filter matches every Song exactly', () => {
    expect(matchSong(song, '  ')).toBe('exact')
  })
})

describe('filterSongs', () => {
  test('exact matches come before fuzzy ones, each group in the order given', () => {
    const songs = [
      { title: 'Lantern', artist: 'Pebble Choir' },
      { title: 'Latern Hill', artist: 'Pebble Choir' },
      { title: 'Lantern Road', artist: 'Pebble Choir' },
      { title: 'Meadow Song', artist: 'The Placeholders' },
      { title: 'Paper Latern', artist: 'Pebble Choir' },
    ]

    expect(filterSongs(songs, 'lantern').map((song) => song.title)).toEqual([
      'Lantern',
      'Lantern Road',
      'Latern Hill',
      'Paper Latern',
    ])
  })
})
