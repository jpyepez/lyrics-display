import { useState, type ChangeEvent } from 'react'
import { EXPORT_FAILED, useExportLibrary } from '../library/backup'
import { importLibrary, type ImportResult } from '../library/library'
import { LibraryFileError } from '../library/libraryFile'
import type { Orientation, PaperSetting, PaperSize } from '../song/sheet'
import { routes } from './route'
import { savePaperSetting, saveThemeSetting, usePaperSetting, useThemeSetting, type Theme } from './settings'

const PAPER_SIZE_OPTIONS: { value: PaperSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
]

const ORIENTATION_OPTIONS: { value: Orientation; label: string }[] = [
  { value: 'portrait', label: 'Portrait' },
  { value: 'landscape', label: 'Landscape' },
]

const THEME_OPTIONS: { value: Theme; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

/**
 * Firefox may print its own date, URL and page numbers even with a zero page margin
 * (docs/gotchas.md). Unverified, so the hint is shown to Firefox users only.
 */
const isFirefox = navigator.userAgent.includes('Firefox/')

/** "1 Song", "2 Songs" and so on. */
const countOf = (count: number, noun: string, plural: string) => `${count} ${count === 1 ? noun : plural}`

/** What the user is told after an import. */
function describeImport({ added, skipped }: ImportResult): string {
  return `Added ${countOf(added, 'Song', 'Songs')}, skipped ${countOf(skipped, 'duplicate', 'duplicates')}.`
}

export function SettingsView() {
  const paper = usePaperSetting()
  const theme = useThemeSetting()
  const [saveFailed, setSaveFailed] = useState(false)
  const [importMessage, setImportMessage] = useState<string>()
  const { exportFile, exportFailed } = useExportLibrary()
  const [importError, setImportError] = useState<string>()

  /** Saves a change as soon as it is picked; there is no Save button. */
  function saveSetting(save: () => void) {
    try {
      save()
      setSaveFailed(false)
    } catch {
      setSaveFailed(true)
    }
  }

  const choosePaper = (setting: PaperSetting) => saveSetting(() => savePaperSetting(setting))
  const chooseTheme = (setting: Theme) => saveSetting(() => saveThemeSetting(setting))

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    if (!file) return
    setImportMessage(undefined)
    setImportError(undefined)
    try {
      setImportMessage(describeImport(await importLibrary(await file.text())))
    } catch (error) {
      const reason = error instanceof LibraryFileError ? error.message : 'The file could not be read or saved.'
      setImportError(`${reason} Your Library is unchanged.`)
    } finally {
      // Lets the same file be picked again.
      input.value = ''
    }
  }

  return (
    <main className="settings">
      <a href={routes.library}>Library</a>
      <h1>Settings</h1>
      <fieldset>
        <legend>Theme</legend>
        {THEME_OPTIONS.map(({ value, label }) => (
          <label key={value}>
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => chooseTheme(value)}
            />
            {label}
          </label>
        ))}
      </fieldset>
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
      {isFirefox && (
        <p className="hint">
          Firefox: if your printout shows the date, the web address or page numbers, untick “Print headers and
          footers” in the print dialog once.
        </p>
      )}
      <section aria-labelledby="backup-heading">
        <h2 id="backup-heading">Backup</h2>
        <p className="hint">
          Your Library is kept only in this browser, which may clear it. Export it now and then, and import the file
          to bring your Songs back or move them to another device.
        </p>
        <div className="actions">
          <button type="button" onClick={exportFile}>
            Export Library
          </button>
          <label className="file-button">
            Import a Library file
            <input type="file" name="library-file" accept="application/json,.json" onChange={importFile} />
          </label>
        </div>
        <p role="status">{importMessage}</p>
        {exportFailed && (
          <p role="alert" className="error">
            {EXPORT_FAILED}
          </p>
        )}
        {importError && (
          <p role="alert" className="error">
            {importError}
          </p>
        )}
      </section>
      {saveFailed && (
        <p role="alert" className="error">
          Could not save the setting on this device.
        </p>
      )}
    </main>
  )
}
