import type { Stanza } from './lyrics'
import type { Override } from './song'

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
  /** Used for Screens only; a Sheet ignores it and always gets the automatic Fit. */
  override?: Override
}

/** A Fit: one font size and the Stanzas placed column by column on one or more surfaces, in order. */
export type Fit = {
  fontSize: number
  columnCount: number
  /** Each surface's columns: one Screen or Sheet unless the Song Spills. */
  surfaces: Stanza[][][]
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
 * Stanza taller than a whole column break between lines, only where a column is full. It
 * starts in the room left in the current column unless that would cost an extra break.
 *
 * An Override fixes the font size, the column count, or both, and the Fit works out the
 * rest the same way. A Song that fits a fixed column count is spread across all of them.
 * A Song that does not fit Spills at the fixed font size, or else the minimum, and in the
 * fixed column count, readable or not.
 */
export function fit({ stanzas, surface, minFontSize, maxFontSize, measurer, ...input }: FitInput): Fit {
  const override = (surface.kind === 'screen' && input.override) || {}
  const sizes = override.fontSize ? [override.fontSize] : fontSizes(maxFontSize, minFontSize)
  for (const fontSize of sizes) {
    const readable = readableColumnCount(stanzas, surface, fontSize, measurer)
    for (let columnCount = override.columnCount ?? 1; columnCount <= readable; columnCount++) {
      const columnWidth = columnWidthFor(surface, columnCount, fontSize)
      const columns = pack(stanzas, columnCount, surface.height, fontSize, columnWidth, measurer)
      if (columns && override.columnCount) {
        const spread = spreadOut(stanzas, columnCount, surface.height, fontSize, columnWidth, measurer)
        return { fontSize, columnCount, surfaces: [spread] }
      }
      if (columns) return { fontSize, columnCount, surfaces: [columns] }
      if (override.columnCount) break
    }
  }
  const fontSize = sizes.at(-1)!
  const columnCount =
    override.columnCount ?? Math.max(1, readableColumnCount(stanzas, surface, fontSize, measurer))
  const columnWidth = columnWidthFor(surface, columnCount, fontSize)
  const columns = pack(stanzas, Infinity, surface.height, fontSize, columnWidth, measurer, true) ?? []
  const surfaces: Stanza[][][] = []
  for (let i = 0; i < columns.length; i += columnCount) {
    surfaces.push(columns.slice(i, i + columnCount))
  }
  return { fontSize, columnCount, surfaces }
}

/** How many columns a surface holds at a font size with every Stanza's widest line unwrapped; 0 when not even one. */
export function readableColumnCount(
  stanzas: Stanza[],
  surface: Surface,
  fontSize: number,
  measurer: TextMeasurer,
): number {
  const widest = Math.max(0, ...stanzas.map((stanza) => measurer.width(stanza, fontSize)))
  let count = 0
  while (columnWidthFor(surface, count + 1, fontSize) >= widest) count++
  return count
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
 * Packs Stanzas that fit `columnCount` columns into the shortest columns that hold them,
 * so a column count Override shows that many columns rather than leaving the last ones empty.
 */
function spreadOut(
  stanzas: Stanza[],
  columnCount: number,
  height: number,
  fontSize: number,
  columnWidth: number,
  measurer: TextMeasurer,
): Stanza[][] {
  // 30 halvings narrow the height to a millionth of a px, finer than any two packings differ.
  let [tooShort, tallEnough] = [0, height]
  for (let i = 0; i < 30; i++) {
    const middle = (tooShort + tallEnough) / 2
    if (pack(stanzas, columnCount, middle, fontSize, columnWidth, measurer)) tallEnough = middle
    else tooShort = middle
  }
  return pack(stanzas, columnCount, tallEnough, fontSize, columnWidth, measurer)!
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

  /**
   * Splits an oversized Stanza into parts that each fill a column, the first fitting
   * `firstRoom`. Undefined when not even one line fits there; a line taller than a whole
   * column still gets a part of its own.
   */
  function split(stanza: Stanza, firstRoom: number): Stanza[] | undefined {
    const parts: Stanza[] = []
    for (let start = 0, room = firstRoom; start < stanza.lines.length; room = height) {
      let end = start
      while (end < stanza.lines.length && heightOf(part(stanza, start, end + 1)) <= room) end++
      if (end === start) {
        if (parts.length === 0 && room < height) return undefined
        end = start + 1
      }
      parts.push(part(stanza, start, end))
      start = end
    }
    return parts
  }

  for (const stanza of stanzas) {
    if (heightOf(stanza) <= height) {
      if (!place(stanza)) return undefined
      continue
    }
    if (!breakOversized) return undefined
    const inFreshColumn = split(stanza, height)!
    const inRoomLeft = split(stanza, height - usedHeight - gap)
    const parts = inRoomLeft && inRoomLeft.length <= inFreshColumn.length ? inRoomLeft : inFreshColumn
    if (parts === inFreshColumn) usedHeight = Infinity
    for (const [i, stanzaPart] of parts.entries()) {
      // The column is full where the Stanza breaks: each later part starts the next one.
      if (i > 0) usedHeight = Infinity
      if (!place(stanzaPart)) return undefined
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
