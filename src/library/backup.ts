import { saveLastBackup } from '../app/settings'
import { exportLibrary } from './library'
import { libraryFileName } from './libraryFile'

/** How long after an export, or a "Not now", the Library asks for another export. */
const BACKUP_INTERVAL_MS = 14 * 24 * 60 * 60 * 1000

/**
 * Whether the Library should ask for an export: it has Songs, and has not been exported (or
 * the reminder put off) in the last two weeks. Browser storage can be cleared, notably by
 * Safari, so an export file is the only lasting copy.
 */
export function isBackupDue(songCount: number, lastBackup: number | undefined, now: number): boolean {
  return songCount > 0 && (lastBackup === undefined || now - lastBackup >= BACKUP_INTERVAL_MS)
}

/** Downloads the whole Library as a Library file and records the export. */
export async function downloadLibraryFile() {
  const now = new Date()
  const url = URL.createObjectURL(new Blob([await exportLibrary()], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = libraryFileName(now)
  link.click()
  // Safari can drop a download whose URL is revoked in the same task.
  setTimeout(() => URL.revokeObjectURL(url))
  try {
    saveLastBackup(now.getTime())
  } catch {
    // Storage unavailable: the file is still downloaded, and the reminder will come back.
  }
}
