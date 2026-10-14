import type { NewSong, Song } from '../song/song'

const DB_NAME = 'lyrics-display'
const DB_VERSION = 1
const SONGS = 'songs'

let db: Promise<IDBDatabase> | undefined

function openDb(): Promise<IDBDatabase> {
  db ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      request.result.createObjectStore(SONGS, { keyPath: 'id' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return db
}

async function run<T>(mode: IDBTransactionMode, query: (songs: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const songs = (await openDb()).transaction(SONGS, mode).objectStore(SONGS)
  return new Promise((resolve, reject) => {
    const request = query(songs)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function addSong(input: NewSong): Promise<Song> {
  const now = Date.now()
  const song: Song = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now }
  await run('readwrite', (songs) => songs.add(song))
  return song
}

export function getSong(id: string): Promise<Song | undefined> {
  return run('readonly', (songs) => songs.get(id) as IDBRequest<Song | undefined>)
}

export function listSongs(): Promise<Song[]> {
  return run('readonly', (songs) => songs.getAll() as IDBRequest<Song[]>)
}
