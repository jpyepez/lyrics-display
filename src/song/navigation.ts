import type { Stanza } from './lyrics'

/** Keys that turn the Screen; a Bluetooth page-turner pedal sends one of these. */
const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' '])
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp'])

/** Where these keys belong to the focused control instead. */
const KEEPS_KEYS = 'input, select, textarea, button, [contenteditable]'

/** +1 for the next Screen, -1 for the previous one, 0 for a key that does not turn it. */
export function keyStep(event: KeyboardEvent): number {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return 0
  if (event.target instanceof Element && event.target.closest(KEEPS_KEYS)) return 0
  return NEXT_KEYS.has(event.key) ? 1 : PREVIOUS_KEYS.has(event.key) ? -1 : 0
}

/** A tap on the right half of the Screen shows the next one, on the left half the previous. */
export function tapStep(x: number, screen: { left: number; width: number }): number {
  return x >= screen.left + screen.width / 2 ? 1 : -1
}

/**
 * Where each surface starts, as the index of its first lyric line in the whole Song. A
 * Stanza split between columns counts its lines where each part is shown.
 */
export function surfaceStarts(surfaces: Stanza[][][]): number[] {
  const starts: number[] = []
  let line = 0
  for (const columns of surfaces) {
    starts.push(line)
    for (const column of columns) for (const stanza of column) line += stanza.lines.length
  }
  return starts
}

/** The surface that shows lyric line `line`, given where each surface starts; 0 when there are none. */
export function surfaceShowing(starts: number[], line: number): number {
  let index = 0
  while (index + 1 < starts.length && starts[index + 1] <= line) index++
  return index
}
