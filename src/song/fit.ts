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

/** A Fit: one font size and the Stanzas placed column by column on one or more surfaces, in order. */
export type Fit = {
  fontSize: number
  columnCount: number
  /** Each surface's columns: one Screen or Sheet unless the Song Spills. */
  screens: Stanza[][][]
}

/** Space between Stanzas in a column, in em. The Song view uses the same value. */
export const STANZA_GAP_EM = 1
/** Space between columns, in em. The Song view uses the same value. */
export const COLUMN_GAP_EM = 2

/**
 * Lays out a Song. Tries the largest font in one column first, then more columns while
 * they stay readable, then a smaller font, one px at a time, down to the minimum. A column
 * is readable when the widest line of every Stanza fits it unwrapped. A Stanza is never
 * split across columns.
 *
 * A Song that cannot fit one surface at the minimum font Spills: it fills the readable
 * columns there and carries on onto as many more surfaces as it needs. Only then may a
 * Stanza taller than a whole column break between lines, and only where a column is full.
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
      if (columns) return { fontSize, columnCount, screens: [columns] }
    }
  }
  const columnWidth = columnWidthFor(surface, readableColumnCount, minFontSize)
  const columns = pack(stanzas, Infinity, surface.height, minFontSize, columnWidth, measurer, true) ?? []
  const screens: Stanza[][][] = []
  for (let i = 0; i < columns.length; i += readableColumnCount) {
    screens.push(columns.slice(i, i + readableColumnCount))
  }
  return { fontSize: minFontSize, columnCount: readableColumnCount, screens }
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
 * Undefined when they need more than `columnCount` columns, or when a Stanza is taller
 * than a column, unless `breakOversized`.
 */
function pack(
  stanzas: Stanza[],
  columnCount: number,
  height: number,
  fontSize: number,
  columnWidth: number,
  measurer: TextMeasurer,
  breakOversized = false,
): Stanza[][] | undefined {
  const gap = STANZA_GAP_EM * fontSize
  const columns: Stanza[][] = []
  /** Height taken in the current column; none open yet, so the first Stanza opens one. */
  let usedHeight = Infinity
  const heightOf = (stanza: Stanza) => measurer.height(stanza, fontSize, columnWidth)

  /** Adds a Stanza after the last, in a new column if it does not fit; false when out of columns. */
  function place(stanza: Stanza): boolean {
    const stanzaHeight = heightOf(stanza)
    if (usedHeight + gap + stanzaHeight <= height) {
      columns[columns.length - 1].push(stanza)
      usedHeight += gap + stanzaHeight
      return true
    }
    if (columns.length === columnCount) return false
    columns.push([stanza])
    usedHeight = stanzaHeight
    return true
  }

  /** End of the longest run of lines from `start` that fits `room`; `start` if none does. */
  function longestPart(stanza: Stanza, start: number, room: number): number {
    let end = start
    while (end < stanza.lines.length && heightOf(part(stanza, start, end + 1)) <= room) end++
    return end
  }

  for (const stanza of stanzas) {
    if (heightOf(stanza) <= height) {
      if (!place(stanza)) return undefined
      continue
    }
    if (!breakOversized) return undefined
    for (let start = 0; start < stanza.lines.length; ) {
      // Fill the rest of this column, else a fresh one; a line taller than a column still gets one.
      let end = longestPart(stanza, start, height - usedHeight - gap)
      if (end === start) end = Math.max(start + 1, longestPart(stanza, start, height))
      if (!place(part(stanza, start, end))) return undefined
      start = end
      // The column is full where the Stanza breaks: the rest starts the next one.
      if (start < stanza.lines.length) usedHeight = Infinity
    }
  }
  return columns
}

/** Parts are kept per Stanza so each one is the same object on every Fit, for measurers that cache by Stanza. */
const partsByStanza = new WeakMap<Stanza, Map<string, Stanza>>()

/** Lines `start` to `end` of a Stanza; the Section Label stays on the part that starts it. */
function part(stanza: Stanza, start: number, end: number): Stanza {
  let byRange = partsByStanza.get(stanza)
  if (!byRange) partsByStanza.set(stanza, (byRange = new Map()))
  const key = `${start}-${end}`
  let result = byRange.get(key)
  if (!result) {
    const lines = stanza.lines.slice(start, end)
    result = start === 0 && stanza.sectionLabel ? { sectionLabel: stanza.sectionLabel, lines } : { lines }
    byRange.set(key, result)
  }
  return result
}
