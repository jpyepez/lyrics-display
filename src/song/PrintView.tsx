import { useMemo, type CSSProperties } from 'react'
import { usePaperSetting } from '../app/settings'
import { COLUMN_GAP_EM, fit, STANZA_GAP_EM, surfaceColumns, type TextMeasurer } from './fit'
import type { Stanza } from './lyrics'
import { measureSheetHeader } from './measure'
import {
  paperFor,
  SHEET_HEIGHT_SLACK,
  SHEET_MAX_FONT_SIZE,
  SHEET_MIN_FONT_SIZE,
  SHEET_PADDING_MM,
  sheetContentWidth,
  sheetSurface,
} from './sheet'
import type { Song } from './song'

type PrintViewProps = {
  song: Song
  stanzas: Stanza[]
  measurer: TextMeasurer
}

/**
 * The Song's Sheets, shown only when printing, from the in-app button or the browser's own
 * Print command, on the paper chosen in Settings. Sheets always get the automatic Fit: the
 * Override is for Screens, and the Note is never printed.
 */
export function PrintView({ song, stanzas, measurer }: PrintViewProps) {
  const paperSetting = usePaperSetting()
  const paper = useMemo(() => paperFor(paperSetting), [paperSetting])
  const headerHeight = useMemo(
    () => measureSheetHeader(song.title, song.artist, sheetContentWidth(paper)),
    [song.title, song.artist, paper],
  )
  const sheetFit = useMemo(
    () =>
      fit({
        stanzas,
        surface: sheetSurface(paper, headerHeight),
        minFontSize: SHEET_MIN_FONT_SIZE,
        maxFontSize: SHEET_MAX_FONT_SIZE,
        measurer,
      }),
    [stanzas, paper, headerHeight, measurer],
  )
  const sheetCount = sheetFit.surfaces.length

  const sheetStyle: CSSProperties = {
    width: `${paper.width}mm`,
    height: `calc(${paper.height}mm - ${SHEET_HEIGHT_SLACK}px)`,
    padding: `${SHEET_PADDING_MM}mm`,
  }
  const lyricsStyle: CSSProperties = { fontSize: sheetFit.fontSize, gap: `${COLUMN_GAP_EM}em` }
  const columnStyle: CSSProperties = { gap: `${STANZA_GAP_EM}em` }

  return (
    <div className="print">
      {/* Zero page margin leaves the browser no room for its date, URL and page numbers. */}
      <style>{`@page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }`}</style>
      {sheetFit.surfaces.map((_, i) => (
        <section key={i} aria-label={`Sheet ${i + 1} of ${sheetCount}`} className="sheet" style={sheetStyle}>
          <header style={{ height: headerHeight }}>
            <h1>{song.title}</h1>
            <p className="artist">{song.artist}</p>
            {sheetCount > 1 && (
              <p className="sheet-number">
                {i + 1}/{sheetCount}
              </p>
            )}
          </header>
          <article aria-label="Lyrics" className="lyrics" style={lyricsStyle}>
            {surfaceColumns(sheetFit, i).map((column, j) => (
              <div key={j} className="column" style={columnStyle}>
                {column.map((stanza, k) => (
                  <div role="group" key={k} className="stanza">
                    {stanza.sectionLabel && <h2 className="section-label">{stanza.sectionLabel}</h2>}
                    {stanza.lines.map((line, l) => (
                      <p key={l} className="line" data-testid="sheet-line">
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </article>
        </section>
      ))}
    </div>
  )
}
