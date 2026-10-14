import type { Override, Song } from '../song/song'

/** The Library file format this app writes and reads. Bump it when the shape changes. */
export const LIBRARY_FILE_VERSION = 1

/** The Library as an export file: a format version and every Song. */
export type LibraryFile = {
  version: typeof LIBRARY_FILE_VERSION
  songs: Song[]
}

export function toLibraryFile(songs: Song[]): string {
  const file: LibraryFile = { version: LIBRARY_FILE_VERSION, songs }
  return JSON.stringify(file, null, 2)
}

/** Today's date in the file name, so exports sort and don't overwrite each other. */
export function libraryFileName(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `lyrics-library-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

/** A Song read from a Library file: everything but the id, which the Library gives it. */
export type ImportedSong = Omit<Song, 'id'>

/** A file that is not a Library file this app can read; `message` is fit to show the user. */
export class LibraryFileError extends Error {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const isText = (value: unknown): value is string => typeof value === 'string'
const isFilled = (value: unknown): value is string => isText(value) && value.trim() !== ''
const isTime = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)
const isPositive = (value: unknown): value is number => isTime(value) && value > 0

function readOverride(value: unknown): Override | undefined | null {
  if (value === undefined) return undefined
  if (!isRecord(value)) return null
  const { fontSize, columnCount } = value
  if (fontSize !== undefined && !isPositive(fontSize)) return null
  if (columnCount !== undefined && !(isPositive(columnCount) && Number.isInteger(columnCount))) return null
  return { ...(fontSize !== undefined && { fontSize }), ...(columnCount !== undefined && { columnCount }) }
}

/**
 * One Song built field by field from the file, or null when a field is missing or the wrong
 * kind. Title, artist and Lyrics must not be blank, as when a Song is pasted.
 */
function readSong(value: unknown): ImportedSong | null {
  if (!isRecord(value)) return null
  const { title, artist, lyrics, note, override, createdAt, updatedAt } = value
  if (!isFilled(title) || !isFilled(artist) || !isFilled(lyrics)) return null
  if (note !== undefined && !isText(note)) return null
  if (!isTime(createdAt) || !isTime(updatedAt)) return null
  const checkedOverride = readOverride(override)
  if (checkedOverride === null) return null
  return {
    title,
    artist,
    lyrics,
    ...(note !== undefined && { note }),
    ...(checkedOverride && { override: checkedOverride }),
    createdAt,
    updatedAt,
  }
}

/** The Songs in Library file text. Throws a LibraryFileError unless the whole file is sound. */
export function parseLibraryFile(text: string): ImportedSong[] {
  let file: unknown
  try {
    file = JSON.parse(text)
  } catch {
    throw new LibraryFileError('This is not a Library file.')
  }
  if (!isRecord(file) || !('version' in file) || !Array.isArray(file.songs)) {
    throw new LibraryFileError('This is not a Library file.')
  }
  if (file.version !== LIBRARY_FILE_VERSION) {
    throw new LibraryFileError(`This Library file is format version ${String(file.version)}, which this app cannot read.`)
  }
  return file.songs.map((value, index) => {
    const song = readSong(value)
    if (!song) throw new LibraryFileError(`Song ${index + 1} in this file is incomplete or damaged.`)
    return song
  })
}
