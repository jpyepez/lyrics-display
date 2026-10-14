import { describe, expect, test } from 'vitest'
import { parseLyrics } from './lyrics'

describe('parseLyrics', () => {
  test('a blank line separates two Stanzas', () => {
    const lyrics = 'Paper lanterns on the river\nDrifting slow past the mill\n\nCount the windows in the morning\nNone of them are open still'

    expect(parseLyrics(lyrics)).toEqual([
      { lines: ['Paper lanterns on the river', 'Drifting slow past the mill'] },
      { lines: ['Count the windows in the morning', 'None of them are open still'] },
    ])
  })

  test('several blank lines in a row make one Stanza break', () => {
    const lyrics = 'Salt on the windowsill\n\n\n  \n\nThe kettle hums a tune'

    expect(parseLyrics(lyrics)).toEqual([
      { lines: ['Salt on the windowsill'] },
      { lines: ['The kettle hums a tune'] },
    ])
  })

  test('blank lines before the first and after the last Stanza add no Stanzas', () => {
    expect(parseLyrics('\n\nOnly one line here\n\n\n')).toEqual([{ lines: ['Only one line here'] }])
  })

  test('empty Lyrics have no Stanzas', () => {
    expect(parseLyrics('')).toEqual([])
  })

  test('a bracketed line that starts a Stanza is its Section Label', () => {
    const lyrics = '[Chorus]\nHey hey the lamp is low\n\n[Verse 2]\nBack along the gravel road'

    expect(parseLyrics(lyrics)).toEqual([
      { sectionLabel: 'Chorus', lines: ['Hey hey the lamp is low'] },
      { sectionLabel: 'Verse 2', lines: ['Back along the gravel road'] },
    ])
  })

  test('a bracketed line inside a Stanza stays a line of Lyrics', () => {
    const lyrics = 'Tin roof rattles\n[softly]\nRain keeps time'

    expect(parseLyrics(lyrics)).toEqual([{ lines: ['Tin roof rattles', '[softly]', 'Rain keeps time'] }])
  })

  test('a Stanza can be only a Section Label', () => {
    expect(parseLyrics('[Instrumental]\n\nHum along now')).toEqual([
      { sectionLabel: 'Instrumental', lines: [] },
      { lines: ['Hum along now'] },
    ])
  })

  test('lines keep their text as written, with only trailing whitespace trimmed', () => {
    const lyrics = '   Oh,  the   lantern!   \t\nOh, the lantern!\nOh, the lantern!'

    expect(parseLyrics(lyrics)).toEqual([
      { lines: ['   Oh,  the   lantern!', 'Oh, the lantern!', 'Oh, the lantern!'] },
    ])
  })

  test('Windows line endings split the same way', () => {
    expect(parseLyrics('[Bridge]\r\nFirst lamp\r\n\r\nSecond lamp\r\n')).toEqual([
      { sectionLabel: 'Bridge', lines: ['First lamp'] },
      { lines: ['Second lamp'] },
    ])
  })

  test('an empty or multi-bracket line at the start of a Stanza stays a line of Lyrics', () => {
    expect(parseLyrics('[ ]\nQuiet now\n\n[low] [high]\nBoth together')).toEqual([
      { lines: ['[ ]', 'Quiet now'] },
      { lines: ['[low] [high]', 'Both together'] },
    ])
  })
})
