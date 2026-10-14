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

/** Keeps a Screen index within `count` Screens. */
export function clampScreenIndex(index: number, count: number): number {
  return Math.min(Math.max(0, index), Math.max(0, count - 1))
}
