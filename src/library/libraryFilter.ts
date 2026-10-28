import type { Song } from '../song/song'

/** How a Song, or one typed word, matched the Library filter. */
export type FilterMatch = 'exact' | 'fuzzy'

/**
 * The words of a title, artist or filter as the Library filter compares them: accents and
 * case dropped, punctuation removed (so "Stand-ins" is `standins` and "Don't" is `dont`),
 * split on whitespace.
 */
function words(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter(Boolean)
}

/** How many edits a typed word may be from a word it matches: short words are too noisy to guess. */
function allowedEdits(typed: string): number {
  if (typed.length <= 3) return 0
  if (typed.length <= 7) return 1
  return 2
}

/**
 * The fewest edits (insert, delete, substitute, or swap two neighbouring characters) that turn
 * `typed` into the whole of `word` or any start of it, so a typo halfway through typing a word
 * still counts. Optimal string alignment distance; the last row holds every start of `word`.
 */
function editsToStart(typed: string, word: string): number {
  const rows: number[][] = []
  for (let i = 0; i <= typed.length; i++) {
    rows.push([i])
    for (let j = 1; j <= word.length; j++) {
      if (i === 0) {
        rows[0].push(j)
        continue
      }
      const cost = typed[i - 1] === word[j - 1] ? 0 : 1
      let edits = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && typed[i - 1] === word[j - 2] && typed[i - 2] === word[j - 1]) {
        edits = Math.min(edits, rows[i - 2][j - 2] + 1)
      }
      rows[i].push(edits)
    }
  }
  return Math.min(...rows[typed.length])
}

function matchNormalized(typed: string, fieldWords: string[]): FilterMatch | undefined {
  if (fieldWords.some((word) => word.includes(typed))) return 'exact'
  const edits = allowedEdits(typed)
  if (edits > 0 && fieldWords.some((word) => editsToStart(typed, word) <= edits)) return 'fuzzy'
  return undefined
}

/**
 * Whether one typed word matches a title or artist: `exact` when it is part of one of its
 * words, `fuzzy` when it is a few edits from one of its words or the start of one.
 */
export function matchWord(typed: string, field: string): FilterMatch | undefined {
  const [word] = words(typed)
  if (!word) return 'exact'
  return matchNormalized(word, words(field))
}

/**
 * Whether a Song matches the Library filter: every typed word must match its title or artist,
 * in any order. `exact` only when every word matched exactly.
 */
export function matchSong(song: Pick<Song, 'title' | 'artist'>, filter: string): FilterMatch | undefined {
  const fieldWords = [...words(song.title), ...words(song.artist)]
  let match: FilterMatch = 'exact'
  for (const typed of words(filter)) {
    const wordMatch = matchNormalized(typed, fieldWords)
    if (!wordMatch) return undefined
    if (wordMatch === 'fuzzy') match = 'fuzzy'
  }
  return match
}

/** The Songs the Library filter shows: exact matches first, then fuzzy ones, each in the order given. */
export function filterSongs<T extends Pick<Song, 'title' | 'artist'>>(songs: T[], filter: string): T[] {
  const matches = songs.map((song) => matchSong(song, filter))
  return [
    ...songs.filter((_, i) => matches[i] === 'exact'),
    ...songs.filter((_, i) => matches[i] === 'fuzzy'),
  ]
}
