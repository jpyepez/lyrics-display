import type { Stanza } from './lyrics'

/** The surface a Song is shown on: a Screen in the app or a printed Sheet. Sizes in CSS px. */
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
  columnCount: number
  columns: Stanza[][]
}

/** Space between Stanzas in a column, in em. The Song view uses the same value. */
export const STANZA_GAP_EM = 1
/** Space between columns, in em. The Song view uses the same value. */
export const COLUMN_GAP_EM = 2

/**
 * Lays out a Song on one surface. Tries the largest font in one column first, then more
 * columns while they stay readable, then a smaller font, one px at a time, down to the
 * minimum. A column is readable when the widest line of every Stanza fits it unwrapped.
 * A Stanza is never split across columns.
 *
 * A Song that cannot fit at the minimum font fills the readable columns there, the last
 * column taking the rest, until Spill arrives (ticket #03).
 */
export function fit({ stanzas, surface, minFontSize, maxFontSize, measurer }: FitInput): Fit {
  let readableColumnCount = 1
  for (const fontSize of fontSizes(maxFontSize, minFontSize)) {
    const widest = Math.max(0, ...stanzas.map((stanza) => measurer.width(stanza, fontSize)))
    for (let columnCount = 1; ; columnCount++) {
      const columnWidth = columnWidthFor(surface, columnCount, fontSize)
      if (columnWidth < widest) break
      readableColumnCount = columnCount
      const columns = pack(stanzas, columnCount, surface.height, fontSize, columnWidth, measurer)
      if (columns) return { fontSize, columnCount, columns }
    }
  }
  const columnWidth = columnWidthFor(surface, readableColumnCount, minFontSize)
  const columns = pack(stanzas, readableColumnCount, surface.height, minFontSize, columnWidth, measurer, true)
  return { fontSize: minFontSize, columnCount: readableColumnCount, columns: columns ?? [stanzas] }
}

function columnWidthFor(surface: Surface, columnCount: number, fontSize: number): number {
  return (surface.width - (columnCount - 1) * COLUMN_GAP_EM * fontSize) / columnCount
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
 * Undefined when they need more than `columnCount` columns, unless `lastTakesRest`,
 * which puts whatever is left in the last column, however tall.
 */
function pack(
  stanzas: Stanza[],
  columnCount: number,
  height: number,
  fontSize: number,
  columnWidth: number,
  measurer: TextMeasurer,
  lastTakesRest = false,
): Stanza[][] | undefined {
  const gap = STANZA_GAP_EM * fontSize
  const columns: Stanza[][] = []
  /** Height taken in the current column; none open yet, so the first Stanza opens one. */
  let usedHeight = Infinity
  for (const stanza of stanzas) {
    const stanzaHeight = measurer.height(stanza, fontSize, columnWidth)
    if (stanzaHeight > height && !lastTakesRest) return undefined
    const full = usedHeight + gap + stanzaHeight > height
    if (full && columns.length < columnCount) {
      columns.push([stanza])
      usedHeight = stanzaHeight
    } else if (full && !lastTakesRest) {
      return undefined
    } else {
      columns[columns.length - 1].push(stanza)
      usedHeight += gap + stanzaHeight
    }
  }
  return columns
}
