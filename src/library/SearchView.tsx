import { useEffect, useState, type FormEvent } from 'react'
import { navigate, routes } from '../app/route'
import { addSong, findSong } from './library'
import { searchLyrics, type SearchOutcome, type SearchResult } from './search'

export function SearchView() {
  const [searching, setSearching] = useState(false)
  /** What the last search asked for and what came back. */
  const [last, setLast] = useState<{ title: string; artist: string; outcome: SearchOutcome }>()
  /** True while a rate limit asks to wait; search never retries on its own. */
  const [waiting, setWaiting] = useState(false)
  const [saveError, setSaveError] = useState<string>()
  const outcome = last?.outcome

  useEffect(() => {
    if (!waiting || outcome?.kind !== 'rate-limited') return
    const timer = setTimeout(() => setWaiting(false), outcome.retryAfterSeconds * 1000)
    return () => clearTimeout(timer)
  }, [waiting, outcome])

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const title = String(form.get('title')).trim()
    const artist = String(form.get('artist')).trim()
    setSearching(true)
    const outcome = await searchLyrics(title, artist)
    setLast({ title, artist, outcome })
    setWaiting(outcome.kind === 'rate-limited')
    setSearching(false)
  }

  async function pick(result: SearchResult, lyrics: string) {
    setSaveError(undefined)
    try {
      const song = await addSong({ title: result.title.trim(), artist: result.artist.trim(), lyrics })
      navigate(routes.song(song.id))
    } catch {
      setSaveError('Could not save the Song. Try again.')
    }
  }

  /** No Lyrics to save: open the Song if the Library has it, otherwise go to paste. */
  async function pickWithoutLyrics(result: SearchResult) {
    const title = result.title.trim()
    const artist = result.artist.trim()
    const existing = await findSong(title, artist).catch(() => undefined)
    navigate(existing ? routes.song(existing.id) : routes.pasteFor(title, artist))
  }

  return (
    <main className="search">
      <h1>Search for a Song</h1>
      <form className="song-form" onSubmit={search}>
        <label>
          Title
          <input name="title" required autoComplete="off" />
        </label>
        <label>
          Artist
          <input name="artist" autoComplete="off" />
        </label>
        <div className="actions">
          <a href={routes.library}>Cancel</a>
          <button type="submit" disabled={searching || waiting}>
            Search
          </button>
        </div>
      </form>
      {outcome?.kind === 'results' && (
        <ul className="results">
          {outcome.results.map(({ lyrics, ...result }) => (
            <li key={result.id}>
              {lyrics !== undefined ? (
                <button type="button" onClick={() => pick(result, lyrics)}>
                  <ResultText result={result} />
                </button>
              ) : (
                <button type="button" onClick={() => pickWithoutLyrics(result)}>
                  <ResultText result={result} /> <span className="instrumental">Instrumental</span>
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {saveError && (
        <p role="alert" className="error">
          {saveError}
        </p>
      )}
      {last && outcome?.kind === 'empty' && (
        <p>
          No Lyrics found for “{last.title}”. <a href={routes.pasteFor(last.title, last.artist)}>Paste the Lyrics</a>
        </p>
      )}
      {last && (outcome?.kind === 'offline' || outcome?.kind === 'rate-limited' || outcome?.kind === 'error') && (
        <p role="alert" className="error">
          {outcome.kind === 'offline' && 'You are offline, so search cannot reach LRCLIB. '}
          {outcome.kind === 'rate-limited' &&
            `LRCLIB is busy. Try again in ${seconds(outcome.retryAfterSeconds)}, or `}
          {outcome.kind === 'error' && 'Search is not working right now. '}
          <a href={routes.pasteFor(last.title, last.artist)}>Paste the Lyrics</a>
        </p>
      )}
    </main>
  )
}

function seconds(count: number): string {
  return count === 1 ? '1 second' : `${count} seconds`
}

function ResultText({ result }: { result: SearchResult }) {
  return (
    <>
      <span className="title">{result.title}</span> <span className="artist">{result.artist}</span>{' '}
      <span className="album">{result.album}</span>
    </>
  )
}
