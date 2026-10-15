import { useCallback, useEffect, useMemo, useState, type CSSProperties, type MouseEvent } from 'react'
import { routes } from '../app/route'
import { getSong, updateSong } from '../library/library'
import { COLUMN_GAP_EM, fit, readableColumnCount, STANZA_GAP_EM, surfaceColumns } from './fit'
import { parseLyrics, type Stanza } from './lyrics'
import { keyStep, surfaceShowing, surfaceStarts, tapStep } from './navigation'
import { createDomMeasurer } from './measure'
import { PrintView } from './PrintView'
import { stepOverride, type OverrideRange, type OverrideStep } from './override'
import type { Override, Song } from './song'
import { useWakeLock } from './wakeLock'

/**
 * Smallest Screen font, the same on desktop and phone: 20px reads from a playing
 * position on a desktop and at arm's length on a phone.
 */
const SCREEN_MIN_FONT_SIZE = 20
const SCREEN_MAX_FONT_SIZE = 72

/** How long the note that an add found the Song already saved stays. */
const ALREADY_SAVED_MS = 5000

/** No Fit yet: kept as one array so the Screen index does not recompute on every render. */
const NO_SURFACES: Stanza[][][] = []

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

/**
 * Moves between Screens by key. It remembers the first line of the Screen turned to, so
 * when the Song is laid out again (a resize, an Override) the Screen showing that line
 * stays in view rather than whichever Screen now has the same number.
 */
function useScreenIndex(surfaces: Stanza[][][]): [number, (step: number) => void] {
  const [anchor, setAnchor] = useState(0)
  const starts = useMemo(() => surfaceStarts(surfaces), [surfaces])
  const turn = useCallback(
    (step: number) =>
      setAnchor((old) => {
        const index = Math.min(Math.max(0, surfaceShowing(starts, old) + step), starts.length - 1)
        return starts[index] ?? old
      }),
    [starts],
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

  return [surfaceShowing(starts, anchor), turn]
}

/** `alreadySaved` when the user just tried to add this Song again: they are told so once. */
export function SongView({ id, alreadySaved = false }: { id: string; alreadySaved?: boolean }) {
  const [song, setSong] = useState<Song | null>()
  // Read once: the URL loses the flag below, and the note should not go with it.
  const [announceAlreadySaved] = useState(alreadySaved)
  const [showAlreadySaved, setShowAlreadySaved] = useState(false)

  useEffect(() => {
    if (!announceAlreadySaved) return
    // Say it once: a reload of this Song should not say it again.
    history.replaceState(null, '', routes.song(id))
  }, [announceAlreadySaved, id])
  const songShown = Boolean(song)
  useEffect(() => {
    if (!announceAlreadySaved || !songShown) return
    // A tick after the Song (and its empty live region) is on screen, so the note is announced.
    const show = setTimeout(() => setShowAlreadySaved(true))
    const hide = setTimeout(() => setShowAlreadySaved(false), ALREADY_SAVED_MS)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
  }, [announceAlreadySaved, songShown])
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
        override: song?.override,
      }),
    [stanzas, screen, measurer, song?.override],
  )
  const overrideRange = useMemo(
    (): OverrideRange | undefined =>
      screen &&
      screenFit && {
        fontSize: screenFit.fontSize,
        columnCount: screenFit.columnCount,
        minFontSize: SCREEN_MIN_FONT_SIZE,
        maxFontSize: SCREEN_MAX_FONT_SIZE,
        // As many as are readable, and beyond that up to one per Stanza, long lines wrapping.
        maxColumnCount: Math.max(
          stanzas.length,
          readableColumnCount(
            stanzas,
            { kind: 'screen', ...screen },
            song?.override?.fontSize ?? SCREEN_MIN_FONT_SIZE,
            measurer,
          ),
        ),
      },
    [screen, screenFit, stanzas, song?.override?.fontSize, measurer],
  )
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)
  const screenCount = screenFit?.surfaces.length ?? 0
  const [screenIndex, turn] = useScreenIndex(screenFit?.surfaces ?? NO_SURFACES)
  // Only while a Song is shown, not while loading or for a Song missing from the Library.
  useWakeLock(Boolean(song))

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

  /**
   * Saves the Override on the Song and shows it once saved; none means back to auto. The
   * controls wait for the save, so each step starts from the Fit the last one gave.
   */
  function saveOverride(override?: Override) {
    if (!song || saving) return
    const next: Song = { ...song, override }
    if (!override) delete next.override
    setSaving(true)
    setSaveFailed(false)
    updateSong(next)
      .then(setSong, () => setSaveFailed(true))
      .finally(() => setSaving(false))
  }

  function onPrintClick(event: MouseEvent<HTMLButtonElement>) {
    // After a tap or click, give the keys back to the Screen so a page-turner pedal still works.
    if (event.detail > 0) event.currentTarget.blur()
    window.print()
  }

  function onScreenClick(event: MouseEvent<HTMLElement>) {
    turn(tapStep(event.clientX, event.currentTarget.getBoundingClientRect()))
  }

  return (
    <>
      <main className="song">
        <header>
          <a href={routes.library}>Library</a>
          <h1>{song.title}</h1>
          <p className="artist">{song.artist}</p>
          {/* Two lines at most, cut off with an ellipsis, so the Note never takes much room from the Lyrics. */}
          {song.note && (
            <p role="note" className="note" title={song.note}>
              {song.note}
            </p>
          )}
          {/* Always laid out, so the Screen's height does not depend on whether the Song Spills. */}
          <p role="status" className="screen-indicator" style={screenCount < 2 ? { visibility: 'hidden' } : undefined}>
            {screenIndex + 1}/{screenCount}
          </p>
          <div className="tools">
            <a href={routes.editSong(song.id)} className="edit-link">
              Edit
            </a>
            <button type="button" className="print-button" onClick={onPrintClick}>
              Print
            </button>
            {overrideRange && (
              <OverrideControls
                override={song.override}
                range={overrideRange}
                saving={saving}
                onChange={saveOverride}
              />
            )}
          </div>
          {saveFailed && (
            <p role="alert" className="error">
              Could not save the change. Try again.
            </p>
          )}
        </header>
        <div className="screen" ref={screenRef} onClick={onScreenClick}>
          <article aria-label="Lyrics" className="lyrics" style={lyricsStyle}>
            {screenFit && surfaceColumns(screenFit, screenIndex).map((column, i) => (
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
        {/* Mounted before it has text, so screen readers announce it. */}
        <div aria-live="polite" className="toast-region">
          {showAlreadySaved && <p className="toast notice">Already in your Library. Showing your saved copy.</p>}
        </div>
      </main>
      <PrintView song={song} stanzas={stanzas} measurer={measurer} />
    </>
  )
}

type OverrideControlsProps = {
  override: Override | undefined
  range: OverrideRange
  /** A save is under way: presses wait for it. */
  saving: boolean
  onChange: (override?: Override) => void
}

const STEP_GROUPS: { name: string; buttons: { step: OverrideStep; label: string; text: string }[] }[] = [
  {
    name: 'Text',
    buttons: [
      { step: 'smaller-text', label: 'Smaller text', text: '−' },
      { step: 'larger-text', label: 'Larger text', text: '+' },
    ],
  },
  {
    name: 'Columns',
    buttons: [
      { step: 'fewer-columns', label: 'Fewer columns', text: '−' },
      { step: 'more-columns', label: 'More columns', text: '+' },
    ],
  },
]

/** Steps the font size or column count from what the Screen shows now, or resets to the automatic Fit. */
function OverrideControls({ override, range, saving, onChange }: OverrideControlsProps) {
  /** Applies the Override, or none for auto; `detail` is 0 when the button was pressed by key. */
  function change(event: MouseEvent<HTMLButtonElement>, next?: Override) {
    // After a tap or click, give the keys back to the Screen so a page-turner pedal still works.
    if (event.detail > 0) event.currentTarget.blur()
    onChange(next)
  }

  return (
    <>
      <div role="group" aria-label="Override" className="override">
        {STEP_GROUPS.map(({ name, buttons }) => (
          <span key={name} className="override-step">
            <span aria-hidden="true">{name}</span>
            {buttons.map(({ step, label, text }) => {
              const next = stepOverride(override, step, range)
              return (
                <button
                  key={step}
                  type="button"
                  aria-label={label}
                  disabled={!next}
                  aria-disabled={saving || undefined}
                  onClick={(event) => next && change(event, next)}
                >
                  {text}
                </button>
              )
            })}
          </span>
        ))}
      </div>
      {/* Outside the group so a narrow header can put it beside Edit and Print. */}
      <button
        type="button"
        className="reset-override"
        disabled={!override}
        aria-disabled={saving || undefined}
        onClick={(event) => change(event)}
      >
        Reset to auto
      </button>
    </>
  )
}
