import { describe, expect, test } from 'vitest'
import { fit, type TextMeasurer } from './fit'
import type { Stanza } from './lyrics'

/**
 * Every character is 0.5em wide and every line (Section Label included) is 1em tall,
 * so widths and heights can be worked out by hand. A line wider than its column wraps.
 */
const fakeMeasurer: TextMeasurer = {
  width: (stanza, fontSize) => Math.max(...rows(stanza).map((row) => row.length)) * 0.5 * fontSize,
  height: (stanza, fontSize, columnWidth) =>
    rows(stanza).reduce((sum, row) => sum + Math.max(1, Math.ceil((row.length * 0.5 * fontSize) / columnWidth)), 0) *
    fontSize,
}

function rows(stanza: Stanza): string[] {
  return stanza.sectionLabel ? [stanza.sectionLabel, ...stanza.lines] : stanza.lines
}

/** A Stanza of `count` lines, each 10 characters long. */
function stanza(name: string, count: number): Stanza {
  return { lines: Array.from({ length: count }, (_, i) => `${name}${i}`.padEnd(10, '.')) }
}

describe('fit', () => {
  test('a short Song gets the largest font in one column', () => {
    const song = [stanza('a', 2), stanza('b', 2)]

    // At 40px: 2 + 1 (gap) + 2 = 5em = 200px tall, 10 chars = 200px wide.
    const result = fit({
      stanzas: song,
      surface: { kind: 'screen', width: 1000, height: 600 },
      minFontSize: 20,
      maxFontSize: 40,
      measurer: fakeMeasurer,
    })

    expect(result).toEqual({ fontSize: 40, columnCount: 1, columns: [song] })
  })

  test('a Song too tall for one column gets more columns before a smaller font', () => {
    const [a, b, c, d] = [stanza('a', 4), stanza('b', 4), stanza('c', 4), stanza('d', 4)]

    // At 40px one column is 4 × 160 + 3 × 40 = 760px, too tall for 600px; 30px would fit
    // one column (570px), but two 460px-wide columns at 40px come first.
    const result = fit({
      stanzas: [a, b, c, d],
      surface: { kind: 'screen', width: 1000, height: 600 },
      minFontSize: 20,
      maxFontSize: 40,
      measurer: fakeMeasurer,
    })

    expect(result).toEqual({ fontSize: 40, columnCount: 2, columns: [[a, b, c], [d]] })
  })

  test('when a second column would be too narrow for the lines, the font gets smaller', () => {
    const song = [stanza('a', 4), stanza('b', 4), stanza('c', 4), stanza('d', 4)]

    // One column is 19em tall: 31px is the largest whole size within 600px. Two columns
    // at 31px are 119px wide, narrower than a 155px line.
    const result = fit({
      stanzas: song,
      surface: { kind: 'screen', width: 300, height: 600 },
      minFontSize: 20,
      maxFontSize: 40,
      measurer: fakeMeasurer,
    })

    expect(result).toEqual({ fontSize: 31, columnCount: 1, columns: [song] })
  })

  test('a Song that cannot fit at the minimum font fills the readable columns, the last taking the rest', () => {
    const song = Array.from({ length: 14 }, (_, i) => stanza(String.fromCharCode(97 + i), 4))

    // At 20px only two 130px columns are readable, holding 6 Stanzas each. Spill is ticket #03.
    const result = fit({
      stanzas: song,
      surface: { kind: 'screen', width: 300, height: 600 },
      minFontSize: 20,
      maxFontSize: 40,
      measurer: fakeMeasurer,
    })

    expect(result).toEqual({ fontSize: 20, columnCount: 2, columns: [song.slice(0, 6), song.slice(6)] })
  })

  test('a line wider than the whole surface makes the font smaller rather than wrap', () => {
    const song = [{ lines: ['x'.repeat(30)] }]

    // 30 characters are 15em wide: 20px is the largest size within 300px.
    const result = fit({
      stanzas: song,
      surface: { kind: 'screen', width: 300, height: 600 },
      minFontSize: 10,
      maxFontSize: 40,
      measurer: fakeMeasurer,
    })

    expect(result).toEqual({ fontSize: 20, columnCount: 1, columns: [song] })
  })

  test('a Stanza that does not fit the rest of a column moves whole to the next', () => {
    const [a, b, c] = [stanza('a', 4), stanza('b', 6), stanza('c', 2)]

    // a (160px) + gap + b (240px) is 440px, over 400px, though 5 of b's lines would fit.
    const result = fit({
      stanzas: [a, b, c],
      surface: { kind: 'screen', width: 1000, height: 400 },
      minFontSize: 40,
      maxFontSize: 40,
      measurer: fakeMeasurer,
    })

    expect(result).toEqual({ fontSize: 40, columnCount: 2, columns: [[a], [b, c]] })
  })

  test('the same Song fits a Screen and a Sheet differently', () => {
    const [a, b, c, d, e, f, g, h] = 'abcdefgh'.split('').map((name) => stanza(name, 4))
    const song = [a, b, c, d, e, f, g, h]

    // Screen: three Stanzas are 14em tall, so 57px in three 350px columns.
    const onScreen = fit({
      stanzas: song,
      surface: { kind: 'screen', width: 1280, height: 800 },
      minFontSize: 20,
      maxFontSize: 72,
      measurer: fakeMeasurer,
    })
    // Sheet: three columns stop being readable above 36px; four Stanzas (19em) give 52px.
    const onSheet = fit({
      stanzas: song,
      surface: { kind: 'sheet', width: 700, height: 1000 },
      minFontSize: 13.33,
      maxFontSize: 72,
      measurer: fakeMeasurer,
    })

    expect(onScreen).toEqual({ fontSize: 57, columnCount: 3, columns: [[a, b, c], [d, e, f], [g, h]] })
    expect(onSheet).toEqual({ fontSize: 52, columnCount: 2, columns: [[a, b, c, d], [e, f, g, h]] })
  })
})
