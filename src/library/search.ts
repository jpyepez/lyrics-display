const SEARCH_URL = 'https://lrclib.net/api/search'
/** How long to wait after a rate limit that gives no usable `retry-after`. */
const DEFAULT_RETRY_AFTER_SECONDS = 60

/** One LRCLIB match. `lyrics` is absent when LRCLIB has no plain Lyrics for it (instrumental). */
export type SearchResult = {
  id: number
  title: string
  artist: string
  album: string
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
    ...(lyrics && { lyrics }),
  }
}

/** `retry-after` in whole seconds; it is either a number of seconds or an HTTP date. */
function retryAfterSeconds(header: string | null): number {
  if (header === null) return DEFAULT_RETRY_AFTER_SECONDS
  const seconds = /^\d+$/.test(header.trim()) ? Number(header) : (Date.parse(header) - Date.now()) / 1000
  return Number.isNaN(seconds) ? DEFAULT_RETRY_AFTER_SECONDS : Math.max(1, Math.ceil(seconds))
}

/**
 * Searches LRCLIB once by title and, when given, artist. It never retries: a rate limit
 * comes back with how long LRCLIB asked to wait.
 */
export async function searchLyrics(title: string, artist: string): Promise<SearchOutcome> {
  const query = new URLSearchParams({ track_name: title })
  if (artist) query.set('artist_name', artist)
  try {
    const response = await fetch(`${SEARCH_URL}?${query}`)
    if (response.status === 429) {
      return { kind: 'rate-limited', retryAfterSeconds: retryAfterSeconds(response.headers.get('retry-after')) }
    }
    if (!response.ok) return { kind: 'error' }
    const tracks = (await response.json()) as LrclibTrack[]
    if (tracks.length === 0) return { kind: 'empty' }
    return { kind: 'results', results: tracks.map(toResult) }
  } catch {
    return navigator.onLine ? { kind: 'error' } : { kind: 'offline' }
  }
}
