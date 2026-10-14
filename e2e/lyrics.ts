const words = ['lantern', 'river', 'kettle', 'window', 'harbor', 'meadow', 'candle', 'pebble']

/** 40 invented Stanzas, "[Verse 1]" to "[Verse 40]", too many for one Screen at any size. */
export const longLyrics = Array.from({ length: 40 }, (_, i) =>
  [
    `[Verse ${i + 1}]`,
    ...Array.from({ length: 4 }, (_, j) => `The ${words[(i + j) % 8]} hums along the ${words[(i + j + 3) % 8]} road`),
  ].join('\n'),
).join('\n\n')
