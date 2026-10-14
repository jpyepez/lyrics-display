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

/**
 * Runs one request against the songs object store in its own transaction. A write settles
 * once the transaction commits, so a reload right after it cannot lose it.
 */
async function songsRequest<T>(
  mode: IDBTransactionMode,
  request: (songs: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const transaction = (await openDb()).transaction(SONGS, mode)
  const result = settle(request(transaction.objectStore(SONGS)))
  if (mode === 'readonly') return result
  const committed = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error)
    transaction.onabort = () => reject(transaction.error)
  })
  const [value] = await Promise.all([result, committed])
  return value
}

export async function addSong(input: NewSong): Promise<Song> {
  const now = Date.now()
  const song: Song = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
  await songsRequest('readwrite', (songs) => songs.add(song))
  return song
}

export function getSong(id: string): Promise<Song | undefined> {
  return songsRequest('readonly', (songs) => songs.get(id) as IDBRequest<Song | undefined>)
}

/** All Songs, oldest first. */
export async function listSongs(): Promise<Song[]> {
  const all = await songsRequest('readonly', (songs) => songs.getAll() as IDBRequest<Song[]>)
  return all.sort((a, b) => a.createdAt - b.createdAt)
}

/** Saves changes to a Song already in the Library. */
export async function updateSong(song: Song): Promise<Song> {
  const updated: Song = { ...song, updatedAt: Date.now() }
  await songsRequest('readwrite', (songs) => songs.put(updated))
  return updated
}
