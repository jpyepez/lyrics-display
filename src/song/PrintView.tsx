import { useMemo, type CSSProperties } from 'react'
import { COLUMN_GAP_EM, fit, STANZA_GAP_EM, type TextMeasurer } from './fit'
import type { Stanza } from './lyrics'
import {
  A4_PORTRAIT,
  SHEET_HEADER_HEIGHT,
  SHEET_MAX_FONT_SIZE,
  SHEET_MIN_FONT_SIZE,
  SHEET_PADDING_MM,
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
 * Print command. Sheets always get the automatic Fit: the Override is for Screens, and the
 * Note is never printed.
 */
export function PrintView({ song, stanzas, measurer }: PrintViewProps) {
  const paper = A4_PORTRAIT
  const sheetFit = useMemo(
    () =>
      fit({
        stanzas,
        surface: sheetSurface(paper),
        minFontSize: SHEET_MIN_FONT_SIZE,
        maxFontSize: SHEET_MAX_FONT_SIZE,
        measurer,
      }),
    [stanzas, paper, measurer],
  )
  const sheetCount = sheetFit.surfaces.length

  const sheetStyle: CSSProperties = {
    width: `${paper.width}mm`,
    height: `${paper.height}mm`,
    padding: `${SHEET_PADDING_MM}mm`,
  }
  const lyricsStyle: CSSProperties = { fontSize: sheetFit.fontSize, gap: `${COLUMN_GAP_EM}em` }
  const columnStyle: CSSProperties = { gap: `${STANZA_GAP_EM}em` }

  return (
    <div className="print">
      {/* Zero page margin leaves the browser no room for its date, URL and page numbers. */}
      <style>{`@page { size: ${paper.width}mm ${paper.height}mm; margin: 0; }`}</style>
      {sheetFit.surfaces.map((columns, i) => (
        <section key={i} aria-label={`Sheet ${i + 1} of ${sheetCount}`} className="sheet" style={sheetStyle}>
          <header style={{ height: SHEET_HEADER_HEIGHT }}>
            <h1>{song.title}</h1>
            <p className="artist">{song.artist}</p>
            {sheetCount > 1 && (
              <p className="sheet-number">
                {i + 1}/{sheetCount}
              </p>
            )}
          </header>
          <div className="lyrics" style={lyricsStyle}>
            {columns.map((column, j) => (
              <div key={j} className="column" style={columnStyle}>
                {column.map((stanza, k) => (
                  <div role="group" key={k} className="stanza">
                    {stanza.sectionLabel && <h2 className="section-label">{stanza.sectionLabel}</h2>}
                    {stanza.lines.map((line, l) => (
                      <p key={l} className="line">
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
