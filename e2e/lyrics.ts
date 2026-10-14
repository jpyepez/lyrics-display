const words = ['lantern', 'river', 'kettle', 'window', 'harbor', 'meadow', 'candle', 'pebble']

/** `count` invented Stanzas, "[Verse 1]" to "[Verse <count>]", each four lines long. */
export function verses(count: number): string {
  return Array.from({ length: count }, (_, i) =>
    [
      `[Verse ${i + 1}]`,
      ...Array.from({ length: 4 }, (_, j) => `The ${words[(i + j) % 8]} hums along the ${words[(i + j + 3) % 8]} road`),
    ].join('\n'),
  ).join('\n\n')
}

/** 40 invented Stanzas, too many for one Screen at any size. */
export const longLyrics = verses(40)
