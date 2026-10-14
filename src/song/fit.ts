import type { Stanza } from './lyrics'

/** Where a Song is shown: a Screen in the app or a printed Sheet. Sizes in CSS px. */
export type Surface = {
  kind: 'screen' | 'sheet'
  width: number
  height: number
}

/** Real font metrics in the app, a predictable fake in tests. Sizes in CSS px. */
export type TextMeasurer = {
  /** Width of the Stanza's widest line (or Section Label), unwrapped. */
  width(stanza: Stanza, fontSize: number): number
  /** Height of the Stanza set in a column this wide, long lines wrapping. */
  height(stanza: Stanza, fontSize: number, columnWidth: number): number
}

export type FitInput = {
  stanzas: Stanza[]
  surface: Surface
  minFontSize: number
  maxFontSize: number
  measurer: TextMeasurer
}

/** A Fit: one font size and the Stanzas placed column by column, in order. */
export type Fit = {
  fontSize: number
  columns: Stanza[][]
}

/** Space between Stanzas in a column, in em. The Song view uses the same value. */
export const STANZA_GAP_EM = 1
/** Space between columns, in em. The Song view uses the same value. */
export const COLUMN_GAP_EM = 2

/**
 * Lays out a Song on one Surface. Tries the largest font in one column first, then more
 * columns while they stay readable, then a smaller font, one px at a time, down to the
 * minimum. A column is readable when the widest line of every Stanza fits it unwrapped.
 * A Stanza is never split across columns.
 */
export function fit({ stanzas, surface, minFontSize, maxFontSize, measurer }: FitInput): Fit {
  for (const fontSize of fontSizes(maxFontSize, minFontSize)) {
    const widest = Math.max(0, ...stanzas.map((stanza) => measurer.width(stanza, fontSize)))
    for (let count = 1; ; count++) {
      const columnWidth = (surface.width - (count - 1) * COLUMN_GAP_EM * fontSize) / count
      if (columnWidth < widest) break
      const columns = pack(stanzas, count, surface.height, fontSize, columnWidth, measurer)
      if (columns) return { fontSize, columns }
    }
  }
  return { fontSize: minFontSize, columns: [stanzas] }
}

/** Whole px sizes from `max` down, ending on `min` exactly. */
function fontSizes(max: number, min: number): number[] {
  const sizes: number[] = []
  for (let size = max; size > min; size--) sizes.push(size)
  sizes.push(min)
  return sizes
}

/**
 * Places the Stanzas in order, filling each column before starting the next.
 * Undefined when they need more than `count` columns.
 */
function pack(
  stanzas: Stanza[],
  count: number,
  height: number,
  fontSize: number,
  columnWidth: number,
  measurer: TextMeasurer,
): Stanza[][] | undefined {
  const gap = STANZA_GAP_EM * fontSize
  const columns: Stanza[][] = []
  let used = Infinity
  for (const stanza of stanzas) {
    const stanzaHeight = measurer.height(stanza, fontSize, columnWidth)
    if (stanzaHeight > height) return undefined
    if (used + gap + stanzaHeight > height) {
      if (columns.length === count) return undefined
      columns.push([stanza])
      used = stanzaHeight
    } else {
      columns[columns.length - 1].push(stanza)
      used += gap + stanzaHeight
    }
  }
  return columns
}
