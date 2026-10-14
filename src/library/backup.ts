import { useState } from 'react'
import { saveLastBackup } from '../app/settings'
import { exportLibrary } from './library'
import { libraryFileName } from './libraryFile'

/** How long after an export, or a "Not now", the Library nudges for another export. */
const BACKUP_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Whether the Library should ask for an export: it has Songs, and has not been exported (or
 * the nudge put off) in the last week, the time after which Safari may clear the storage of
 * a site not visited. An export file is the only lasting copy.
 */
export function isBackupDue(songCount: number, lastBackup: number | undefined, now: number): boolean {
  return songCount > 0 && (lastBackup === undefined || now - lastBackup >= BACKUP_INTERVAL_MS)
}

/** Records an export or a "Not now"; without storage the nudge just comes back sooner. */
export function recordBackup(time: number) {
  try {
    saveLastBackup(time)
  } catch {
    // Storage unavailable: nothing to keep the nudge away, which errs on the safe side.
  }
}

/**
 * Downloads the whole Library as a Library file and records the export. Rejects when the
 * Library can't be read; nothing is downloaded then.
 */
async function downloadLibraryFile() {
  const now = new Date()
  const url = URL.createObjectURL(new Blob([await exportLibrary()], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = libraryFileName(now)
  link.click()
  // Safari can drop a download whose URL is revoked in the same task.
  setTimeout(() => URL.revokeObjectURL(url))
  recordBackup(now.getTime())
}

export const EXPORT_FAILED = 'Could not export the Library. Try again.'

/** An export action for a button, and whether the last export failed. */
export function useExportLibrary() {
  const [exportFailed, setExportFailed] = useState(false)

  async function exportFile() {
    setExportFailed(false)
    try {
      await downloadLibraryFile()
    } catch {
      setExportFailed(true)
    }
  }

  return { exportFile, exportFailed }
}
