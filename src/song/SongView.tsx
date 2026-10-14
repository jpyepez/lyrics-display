import { useCallback, useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { routes } from '../app/route'
import { getSong } from '../library/library'
import { COLUMN_GAP_EM, fit, STANZA_GAP_EM } from './fit'
import { parseLyrics } from './lyrics'
import { clampScreenIndex, keyStep, tapStep } from './navigation'
import { createDomMeasurer } from './measure'
import type { Song } from './song'

/**
 * Smallest Screen font, the same on desktop and phone: 20px reads from a playing
 * position on a desktop and at arm's length on a phone.
 */
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

/** Moves between `count` Screens by key; the index stays within them when `count` changes. */
function useScreenIndex(count: number): [number, (step: number) => void] {
  const [wanted, setWanted] = useState(0)
  const turn = useCallback(
    (step: number) => setWanted((old) => clampScreenIndex(clampScreenIndex(old, count) + step, count)),
    [count],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const step = keyStep(event)
      if (!step) return
      event.preventDefault()
      turn(step)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [turn])

  return [clampScreenIndex(wanted, count), turn]
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
  const screenFit = useMemo(
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
  const screenCount = screenFit?.surfaces.length ?? 0
  const [screenIndex, turn] = useScreenIndex(screenCount)

  if (song === undefined) return null
  if (song === null) {
    return (
      <main className="song">
        <p>This Song is not in the Library.</p>
        <a href={routes.library}>Back to Library</a>
      </main>
    )
  }

  const lyricsStyle: CSSProperties = screenFit ? { fontSize: screenFit.fontSize, gap: `${COLUMN_GAP_EM}em` } : {}
  const columnStyle: CSSProperties = { gap: `${STANZA_GAP_EM}em` }

  function onScreenClick(event: MouseEvent<HTMLElement>) {
    turn(tapStep(event.clientX, event.currentTarget.getBoundingClientRect()))
  }

  return (
    <main className="song">
      <header>
        <a href={routes.library}>Library</a>
        <h1>{song.title}</h1>
        <p className="artist">{song.artist}</p>
        {/* Always laid out, so the Screen's height does not depend on whether the Song Spills. */}
        <p role="status" className="screen-indicator" style={screenCount < 2 ? { visibility: 'hidden' } : undefined}>
          {screenIndex + 1}/{screenCount}
        </p>
      </header>
      <div className="screen" ref={screenRef} onClick={onScreenClick}>
        <article aria-label="Lyrics" className="lyrics" style={lyricsStyle}>
          {screenFit?.surfaces[screenIndex]?.map((column, i) => (
            <div key={i} className="column" style={columnStyle}>
              {column.map((stanza, j) => (
                <div role="group" key={j} className="stanza">
                  {stanza.sectionLabel && <h2 className="section-label">{stanza.sectionLabel}</h2>}
                  {stanza.lines.map((line, k) => (
                    <p key={k} className="line" data-testid="lyric-line">
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
