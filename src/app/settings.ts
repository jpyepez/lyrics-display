import { useMemo, useSyncExternalStore } from 'react'
import { DEFAULT_PAPER_SETTING, type Orientation, type PaperSetting, type PaperSize } from '../song/sheet'

/**
 * App-wide settings, kept in localStorage on this device. Unlike the Library they are small
 * and read while rendering, so synchronous storage suits them; losing them only brings back
 * the defaults.
 */
const PAPER_KEY = 'lyrics-display.paper'

const PAPER_SIZES: readonly PaperSize[] = ['a4', 'letter']
const ORIENTATIONS: readonly Orientation[] = ['portrait', 'landscape']

const listeners = new Set<() => void>()

/** The stored setting as written, or null when there is none or storage can't be read. */
function readPaperSetting(): string | null {
  try {
    return localStorage.getItem(PAPER_KEY)
  } catch {
    return null
  }
}

function parsePaperSetting(stored: string | null): PaperSetting {
  try {
    const { size, orientation } = JSON.parse(stored ?? 'null') ?? {}
    if (PAPER_SIZES.includes(size) && ORIENTATIONS.includes(orientation)) return { size, orientation }
  } catch {
    // Not JSON: fall back to the default.
  }
  return DEFAULT_PAPER_SETTING
}

function subscribe(onChange: () => void) {
  listeners.add(onChange)
  // Another tab changing the setting.
  window.addEventListener('storage', onChange)
  return () => {
    listeners.delete(onChange)
    window.removeEventListener('storage', onChange)
  }
}

/** The paper Sheets print on; A4 portrait until the user picks another. */
export function usePaperSetting(): PaperSetting {
  // The snapshot is the stored string, so it stays the same between changes.
  const stored = useSyncExternalStore(subscribe, readPaperSetting)
  return useMemo(() => parsePaperSetting(stored), [stored])
}

/** Stores the paper setting on this device. Throws when storage is unavailable. */
export function savePaperSetting(setting: PaperSetting) {
  localStorage.setItem(PAPER_KEY, JSON.stringify(setting))
  for (const listener of listeners) listener()
}

/**
 * When the user last exported the Library or put off the nudge to, in ms since the epoch.
 * Kept here, not in the Library, so the export file never carries it.
 */
const BACKUP_KEY = 'lyrics-display.last-backup'

function readLastBackup(): string | null {
  try {
    return localStorage.getItem(BACKUP_KEY)
  } catch {
    return null
  }
}

/** The last export or "Not now", or undefined when there has been neither. */
export function useLastBackup(): number | undefined {
  const stored = useSyncExternalStore(subscribe, readLastBackup)
  const time = Number(stored ?? Number.NaN)
  return Number.isFinite(time) ? time : undefined
}

/** Records an export or a "Not now" at `time`. Throws when storage is unavailable. */
export function saveLastBackup(time: number) {
  localStorage.setItem(BACKUP_KEY, String(time))
  for (const listener of listeners) listener()
}

/**
 * Set once the app has asked the browser to keep the Library, so a browser that answers
 * with a prompt (Firefox) is not asked again on every visit.
 */
const PERSISTENCE_ASKED_KEY = 'lyrics-display.persistence-asked'

/** Whether the app has asked for persistent storage on this device before. */
export function wasPersistenceAsked(): boolean {
  try {
    return localStorage.getItem(PERSISTENCE_ASKED_KEY) !== null
  } catch {
    return false
  }
}

/** Records that the app asked for persistent storage; does nothing when storage is unavailable. */
export function savePersistenceAsked() {
  try {
    localStorage.setItem(PERSISTENCE_ASKED_KEY, 'true')
  } catch {
    // Unavailable storage: the request is made again next visit, which is harmless.
  }
}
