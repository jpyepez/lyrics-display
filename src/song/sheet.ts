import type { Surface } from './fit'

/** A sheet of paper as it goes through the printer, in mm. */
export type Paper = { width: number; height: number }

export const A4_PORTRAIT: Paper = { width: 210, height: 297 }

/** White space around a Sheet's content, inside the page: the page margin is zero. In mm. */
export const SHEET_PADDING_MM = 15

/** Height of the title and artist line at the top of a Sheet, in CSS px. */
export const SHEET_HEADER_HEIGHT = 40

/** Smallest Sheet font: 10pt, in CSS px. */
export const SHEET_MIN_FONT_SIZE = (10 * 96) / 72

/** Largest Sheet font: 24pt, in CSS px, so a short Song still looks like a lyric sheet. */
export const SHEET_MAX_FONT_SIZE = 32

const PX_PER_MM = 96 / 25.4

/** The room a Sheet on this paper leaves for Lyrics, below its header and inside its padding. */
export function sheetSurface(paper: Paper): Surface {
  return {
    kind: 'sheet',
    width: (paper.width - 2 * SHEET_PADDING_MM) * PX_PER_MM,
    height: (paper.height - 2 * SHEET_PADDING_MM) * PX_PER_MM - SHEET_HEADER_HEIGHT,
  }
}
