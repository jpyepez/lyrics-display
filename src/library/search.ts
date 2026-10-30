const SEARCH_URL = 'https://lrclib.net/api/search'
/** How long to wait after a rate limit that gives no usable `retry-after`. */
const DEFAULT_RETRY_AFTER_SECONDS = 60

/** One LRCLIB match. `lyrics` is absent when LRCLIB has no plain Lyrics for it (instrumental). */
export type SearchResult = {
  id: number
  title: string
  artist: string
  album: string
  /** Length of the recording in seconds, when LRCLIB knows it. */
  duration?: number
  lyrics?: string
}

export type SearchOutcome =
  | { kind: 'results'; results: SearchResult[] }
  | { kind: 'empty' }
  | { kind: 'offline' }
  /** LRCLIB asked to wait `retryAfterSeconds` before the next search. */
  | { kind: 'rate-limited'; retryAfterSeconds: number }
  | { kind: 'error' }

/** The fields of an LRCLIB search result this app reads. */
type LrclibTrack = {
  id: number
  trackName: string
  artistName: string
  albumName: string
  duration: number | null
  instrumental: boolean
  plainLyrics: string | null
}

function toResult(track: LrclibTrack): SearchResult {
  const lyrics = !track.instrumental && track.plainLyrics?.trim() ? track.plainLyrics : undefined
  return {
    id: track.id,
    title: track.trackName,
    artist: track.artistName,
    album: track.albumName,
    ...(track.duration && { duration: track.duration }),
    ...(lyrics && { lyrics }),
  }
}

/**
 * What tells one match from another with the same title and artist: its length, how many
 * lines of Lyrics it has and its first line, as "3:20 · 3 lines · The harbor hums at night".
 */
export function resultDetail({ duration, lyrics }: SearchResult): string {
  const parts: string[] = []
  if (duration) {
    const seconds = Math.round(duration)
    parts.push(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`)
  }
  const lines = (lyrics ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length > 0) parts.push(lines.length === 1 ? '1 line' : `${lines.length} lines`, lines[0])
  return parts.join(' · ')
}

/** `retry-after` in whole seconds (a number of seconds or an HTTP date), or null when absent or unreadable. */
function retryAfterSeconds(header: string | null): number | null {
  if (header === null) return null
  const seconds = /^\d+$/.test(header.trim()) ? Number(header) : (Date.parse(header) - Date.now()) / 1000
  return Number.isNaN(seconds) ? null : Math.max(1, Math.ceil(seconds))
}

/**
 * Searches LRCLIB once by title and, when given, artist. It never retries: a rate limit
 * (or a 503 with a `retry-after`) comes back with how long LRCLIB asked to wait.
 */
export async function searchLyrics(title: string, artist: string): Promise<SearchOutcome> {
  const query = new URLSearchParams({ track_name: title })
  if (artist) query.set('artist_name', artist)
  try {
    const response = await fetch(`${SEARCH_URL}?${query}`)
    const wait = retryAfterSeconds(response.headers.get('retry-after'))
    if (response.status === 429) {
      return { kind: 'rate-limited', retryAfterSeconds: wait ?? DEFAULT_RETRY_AFTER_SECONDS }
    }
    // A busy server (503) that says how long to wait is handled like a rate limit; without a wait it is an error.
    if (response.status === 503 && wait !== null) return { kind: 'rate-limited', retryAfterSeconds: wait }
    if (!response.ok) return { kind: 'error' }
    const tracks = (await response.json()) as LrclibTrack[]
    if (tracks.length === 0) return { kind: 'empty' }
    return { kind: 'results', results: tracks.map(toResult) }
  } catch {
    return navigator.onLine ? { kind: 'error' } : { kind: 'offline' }
  }
}
