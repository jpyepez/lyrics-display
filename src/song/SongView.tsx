import { useCallback, useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { routes } from '../app/route'
import { getSong } from '../library/library'
import { COLUMN_GAP_EM, fit, STANZA_GAP_EM } from './fit'
import { parseLyrics } from './lyrics'
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

/** Keys that turn the Screen; a Bluetooth page-turner pedal sends one of these. */
const NEXT_KEYS = new Set(['ArrowRight', 'ArrowDown', 'PageDown', ' '])
const PREVIOUS_KEYS = new Set(['ArrowLeft', 'ArrowUp', 'PageUp'])

/** Moves between `count` Screens by key; the index stays within them when `count` changes. */
function useScreenIndex(count: number): [number, (step: number) => void] {
  const [wanted, setWanted] = useState(0)
  const turn = useCallback(
    (step: number) => setWanted((old) => clampIndex(clampIndex(old, count) + step, count)),
    [count],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      const step = NEXT_KEYS.has(event.key) ? 1 : PREVIOUS_KEYS.has(event.key) ? -1 : 0
      if (!step) return
      event.preventDefault()
      turn(step)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [turn])

  return [clampIndex(wanted, count), turn]
}

function clampIndex(index: number, count: number): number {
  return Math.min(Math.max(0, index), Math.max(0, count - 1))
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
  const screenCount = screenFit?.screens.length ?? 0
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

  /** A tap on the right half shows the next Screen, on the left half the previous one. */
  function onScreenClick(event: MouseEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    turn(event.clientX >= box.left + box.width / 2 ? 1 : -1)
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
          {screenFit?.screens[screenIndex]?.map((column, i) => (
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
