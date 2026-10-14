import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { routes } from '../app/route'
import { getSong } from '../library/library'
import { COLUMN_GAP_EM, fit, STANZA_GAP_EM } from './fit'
import { parseLyrics } from './lyrics'
import { createDomMeasurer } from './measure'
import type { Song } from './song'

/** Smallest Screen font: readable from a playing position, desktop or phone at arm's length. */
const SCREEN_MIN_FONT_SIZE = 20
const SCREEN_MAX_FONT_SIZE = 72

type Size = { width: number; height: number }

/** Tracks an element's content size; covers window resize and phone rotation alike. */
function useElementSize(): [(element: HTMLElement | null) => void, Size | undefined] {
  const [element, setElement] = useState<HTMLElement | null>(null)
  const [size, setSize] = useState<Size>()

  useEffect(() => {
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((old) => (old?.width === width && old.height === height ? old : { width, height }))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [element])

  return [setElement, size]
}

export function SongView({ id }: { id: string }) {
  const [song, setSong] = useState<Song | null>()
  const [screenRef, screen] = useElementSize()
  const measurer = useMemo(() => createDomMeasurer(), [])
  useEffect(() => measurer.dispose, [measurer])

  useEffect(() => {
    getSong(id).then((found) => setSong(found ?? null))
  }, [id])

  const stanzas = useMemo(() => (song ? parseLyrics(song.lyrics) : []), [song])
  const layout = useMemo(
    () =>
      screen &&
      fit({
        stanzas,
        surface: { kind: 'screen', ...screen },
        minFontSize: SCREEN_MIN_FONT_SIZE,
        maxFontSize: SCREEN_MAX_FONT_SIZE,
        measurer,
      }),
    [stanzas, screen, measurer],
  )

  if (song === undefined) return null
  if (song === null) {
    return (
      <main className="song">
        <p>This Song is not in the Library.</p>
        <a href={routes.library}>Back to Library</a>
      </main>
    )
  }

  const lyricsStyle: CSSProperties = layout ? { fontSize: layout.fontSize, gap: `${COLUMN_GAP_EM}em` } : {}
  const columnStyle: CSSProperties = { gap: `${STANZA_GAP_EM}em` }

  return (
    <main className="song">
      <header>
        <a href={routes.library}>Library</a>
        <h1>{song.title}</h1>
        <p className="artist">{song.artist}</p>
      </header>
      <div className="screen" ref={screenRef}>
        <article aria-label="Lyrics" className="lyrics" style={lyricsStyle}>
          {layout?.columns.map((column, i) => (
            <div key={i} className="column" style={columnStyle}>
              {column.map((stanza) => (
                <div role="group" key={stanzas.indexOf(stanza)} className="stanza">
                  {stanza.sectionLabel && <h2 className="section-label">{stanza.sectionLabel}</h2>}
                  {stanza.lines.map((line, j) => (
                    <p key={j} className="line" data-testid="lyric-line">
                      {line}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </article>
      </div>
    </main>
  )
}
