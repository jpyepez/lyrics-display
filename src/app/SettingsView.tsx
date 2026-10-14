import { useState } from 'react'
import type { Orientation, PaperSetting, PaperSize } from '../song/sheet'
import { routes } from './route'
import { savePaperSetting, usePaperSetting } from './settings'

const PAPER_SIZE_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
]

const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

/**
 * Firefox may print its own date, URL and page numbers even with a zero page margin
 * (docs/gotchas.md). Unverified, so the hint is shown to Firefox users only.
 */
const isFirefox = navigator.userAgent.includes('Firefox/')

export function SettingsView() {
  const paper = usePaperSetting()
  const [saveFailed, setSaveFailed] = useState(false)

  /** Saves a change as soon as it is picked; there is no Save button. */
  function choosePaper(setting: PaperSetting) {
    try {
      savePaperSetting(setting)
      setSaveFailed(false)
    } catch {
      setSaveFailed(true)
    }
  }

  return (
    <main className="settings">
      <a href={routes.library}>Library</a>
      <h1>Settings</h1>
      <fieldset>
        <legend>Paper size</legend>
        {PAPER_SIZE_OPTIONS.map(({ value, label }) => (
          <label key={value}>
            <input
              type="radio"
              name="size"
              value={value}
              checked={paper.size === value}
              onChange={() => choosePaper({ ...paper, size: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend>Orientation</legend>
        {ORIENTATION_OPTIONS.map(({ value, label }) => (
          <label key={value}>
            <input
              type="radio"
              name="orientation"
              value={value}
              checked={paper.orientation === value}
              onChange={() => choosePaper({ ...paper, orientation: value })}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <p className="hint">Landscape gives more columns on each Sheet.</p>
      {isFirefox && (
        <p className="hint">
          Firefox: if your printout shows the date, the web address or page numbers, untick “Print headers and
          footers” in the print dialog once.
        </p>
      )}
      {saveFailed && (
        <p role="alert" className="error">
          Could not save the setting on this device.
        </p>
      )}
    </main>
  )
}
