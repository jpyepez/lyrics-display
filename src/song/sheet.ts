import type { Surface } from './fit'

/** A sheet of paper as it goes through the printer, in mm. */
export type Paper = { width: number; height: number }

/** Paper sizes the app prints on, upright, in mm. */
const PAPER_SIZES = {
  a4: { width: 210, height: 297 },
  letter: { width: 215.9, height: 279.4 },
} satisfies Record<string, Paper>

export type PaperSize = keyof typeof PAPER_SIZES
export type Orientation = 'portrait' | 'landscape'

/** The paper the user prints on: app-wide, stored on the device. */
export type PaperSetting = { size: PaperSize; orientation: Orientation }

export const DEFAULT_PAPER_SETTING: PaperSetting = { size: 'a4', orientation: 'portrait' }

/** The sheet of paper a setting stands for, turned on its side for landscape. */
export function paperFor({ size, orientation }: PaperSetting): Paper {
  const { width, height } = PAPER_SIZES[size]
  return orientation === 'landscape' ? { width: height, height: width } : { width, height }
}

/** White space around a Sheet's content, inside the page: the page margin is zero. In mm. */
export const SHEET_PADDING_MM = 15

/**
 * How much shorter than the page a Sheet is, in CSS px: a Sheet exactly as tall as the
 * page can round up past it and print a blank page after itself.
 */
export const SHEET_HEIGHT_SLACK = 1

const PX_PER_PT = 96 / 72
const PX_PER_MM = 96 / 25.4

/** Smallest Sheet font: 10pt, in CSS px. */
export const SHEET_MIN_FONT_SIZE = 10 * PX_PER_PT

/** Largest Sheet font: 24pt, in CSS px, so a short Song still looks like a lyric sheet. */
export const SHEET_MAX_FONT_SIZE = 24 * PX_PER_PT

/** The width a Sheet on this paper leaves for its header and Lyrics, inside its padding, in CSS px. */
export function sheetContentWidth(paper: Paper): number {
  return (paper.width - 2 * SHEET_PADDING_MM) * PX_PER_MM
}

/** The room a Sheet on this paper leaves for Lyrics, below a header this tall (CSS px) and inside its padding. */
export function sheetSurface(paper: Paper, headerHeight: number): Surface {
  return {
    kind: 'sheet',
    width: sheetContentWidth(paper),
    height: (paper.height - 2 * SHEET_PADDING_MM) * PX_PER_MM - SHEET_HEIGHT_SLACK - headerHeight,
  }
}
