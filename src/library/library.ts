import type { NewSong, Song } from '../song/song'

const DB_NAME = 'lyrics-display'
const DB_VERSION = 1
const SONGS = 'songs'

let db: Promise<IDBDatabase> | undefined

function settle<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function openDb(): Promise<IDBDatabase> {
  if (!db) {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(SONGS, { keyPath: 'id' })
    }
    db = settle(request)
  }
  return db
}

/** Settles once the transaction commits, so a reload right after a write cannot lose it. */
function commit(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
}

/** Runs one request against the songs object store in its own transaction; a write settles on commit. */
async function songsRequest<T>(
  mode: IDBTransactionMode,
  request: (songs: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const transaction = (await openDb()).transaction(SONGS, mode)
  const result = settle(request(transaction.objectStore(SONGS)))
  if (mode === 'readonly') return result
  const [value] = await Promise.all([result, commit(transaction)])
  return value
}

/** Title and artist as the duplicate rule compares them: trimmed, ignoring case. */
function songKey({ title, artist }: Pick<Song, 'title' | 'artist'>): string {
  const fold = (text: string) => text.trim().toLocaleLowerCase()
  return JSON.stringify([fold(title), fold(artist)])
}

/**
 * Adds a Song, unless one with the same title and artist (trimmed, ignoring case) is already
 * in the Library: then that Song comes back unchanged. The check and the add share one
 * transaction, so two quick adds of the same Song cannot both get in.
 */
export async function addSong(input: NewSong): Promise<Song> {
  const transaction = (await openDb()).transaction(SONGS, 'readwrite')
  const songs = transaction.objectStore(SONGS)
  const committed = commit(transaction)
  const key = songKey(input)
  const existing = (await settle(songs.getAll() as IDBRequest<Song[]>)).find((song) => songKey(song) === key)
  if (existing) {
    await committed
    return existing
  }
  const now = Date.now()
  const song: Song = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
  await Promise.all([settle(songs.add(song)), committed])
  return song
}

export function getSong(id: string): Promise<Song | undefined> {
  return songsRequest('readonly', (songs) => songs.get(id) as IDBRequest<Song | undefined>)
}

/** All Songs, sorted by title, ignoring case. */
export async function listSongs(): Promise<Song[]> {
  const all = await songsRequest('readonly', (songs) => songs.getAll() as IDBRequest<Song[]>)
  return all.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: 'base' }))
}

/** Whether part of the Song's title or artist matches the Library filter, ignoring case. */
export function matchesFilter(song: Song, filter: string): boolean {
  const needle = filter.trim().toLowerCase()
  return song.title.toLowerCase().includes(needle) || song.artist.toLowerCase().includes(needle)
}

/** Saves changes to a Song already in the Library. */
export async function updateSong(song: Song): Promise<Song> {
  const updated: Song = { ...song, updatedAt: Date.now() }
  await songsRequest('readwrite', (songs) => songs.put(updated))
  return updated
}

export async function deleteSong(id: string): Promise<void> {
  await songsRequest('readwrite', (songs) => songs.delete(id))
}

/** Puts a deleted Song back exactly as it was, with its id, Note, Override and times. */
export async function restoreSong(song: Song): Promise<void> {
  await songsRequest('readwrite', (songs) => songs.put(song))
}
