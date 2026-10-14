export type Stanza = {
  sectionLabel?: string
  lines: string[]
}

const SECTION_LABEL = /^\s*\[(.+)\]\s*$/

export function parseLyrics(lyrics: string): Stanza[] {
  const stanzas: Stanza[] = []
  let current: Stanza | undefined

  for (const rawLine of lyrics.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (line === '') {
      current = undefined
      continue
    }
    if (!current) {
      current = { lines: [] }
      stanzas.push(current)
      const label = SECTION_LABEL.exec(line)
      if (label) {
        current.sectionLabel = label[1].trim()
        continue
      }
    }
    current.lines.push(line)
  }

  return stanzas
}
