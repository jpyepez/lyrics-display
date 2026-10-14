import { useEffect, useMemo, useState } from 'react'
import { routes } from '../app/route'
import { getSong } from '../library/library'
import { parseLyrics } from './lyrics'
import type { Song } from './song'

export function SongView({ id }: { id: string }) {
  const [song, setSong] = useState<Song | null>()

  useEffect(() => {
    getSong(id).then((found) => setSong(found ?? null))
  }, [id])

  const stanzas = useMemo(() => (song ? parseLyrics(song.lyrics) : []), [song])

  if (song === undefined) return null
  if (song === null) {
    return (
      <main className="song">
        <p>This Song is not in the Library.</p>
        <a href={routes.library}>Back to Library</a>
      </main>
    )
  }

  return (
    <main className="song">
      <header>
        <a href={routes.library}>Library</a>
        <h1>{song.title}</h1>
        <p className="artist">{song.artist}</p>
      </header>
      <article aria-label="Lyrics" className="lyrics">
        {stanzas.map((stanza, i) => (
          <div role="group" key={i} className="stanza">
            {stanza.sectionLabel && <h2 className="section-label">{stanza.sectionLabel}</h2>}
            {stanza.lines.map((line, j) => (
              <p key={j} className="line" data-testid="lyric-line">
                {line}
              </p>
            ))}
          </div>
        ))}
      </article>
    </main>
  )
}
