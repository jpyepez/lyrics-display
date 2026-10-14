import type { Override } from './song'

/** One press of an Override control. */
export type OverrideStep = 'smaller-text' | 'larger-text' | 'fewer-columns' | 'more-columns'

/** What the Screen shows now, and how far the Override may move from it. */
export type OverrideRange = {
  fontSize: number
  columnCount: number
  minFontSize: number
  maxFontSize: number
  /** The most columns that stay readable at the smallest font the Override allows. */
  maxColumnCount: number
}

/** How much one press of Smaller or Larger text changes the font size, in px. */
const FONT_SIZE_STEP = 2

/**
 * The Override after one step from what the Screen shows now, keeping the other part of
 * it; undefined when the step would leave the range.
 */
export function stepOverride(override: Override | undefined, step: OverrideStep, range: OverrideRange): Override | undefined {
  const { fontSize, columnCount, minFontSize, maxFontSize, maxColumnCount } = range
  switch (step) {
    case 'smaller-text':
      return fontSize > minFontSize ? { ...override, fontSize: Math.max(minFontSize, fontSize - FONT_SIZE_STEP) } : undefined
    case 'larger-text':
      return fontSize < maxFontSize ? { ...override, fontSize: Math.min(maxFontSize, fontSize + FONT_SIZE_STEP) } : undefined
    case 'fewer-columns':
      return columnCount > 1 ? { ...override, columnCount: columnCount - 1 } : undefined
    case 'more-columns':
      return columnCount < maxColumnCount ? { ...override, columnCount: columnCount + 1 } : undefined
  }
}
