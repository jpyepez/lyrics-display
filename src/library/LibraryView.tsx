import { useEffect, useState } from 'react'
import { navigate, routes } from '../app/route'
import type { Song } from '../song/song'
import { deleteSong, listSongs, restoreSong } from './library'

/** How long the Undo toast stays after a delete. */
const UNDO_MS = 5000

/** Whether part of the Song's title or artist matches the filter, ignoring case. */
function matches(song: Song, filter: string): boolean {
  const needle = filter.trim().toLowerCase()
  return song.title.toLowerCase().includes(needle) || song.artist.toLowerCase().includes(needle)
}

export function LibraryView() {
  const [songs, setSongs] = useState<Song[]>()
  const [filter, setFilter] = useState('')
  /** The Song last deleted, while it can still be restored. */
  const [deleted, setDeleted] = useState<Song>()

  useEffect(() => {
    listSongs().then(setSongs)
  }, [])

  useEffect(() => {
    if (!deleted) return
    const timer = setTimeout(() => setDeleted(undefined), UNDO_MS)
    return () => clearTimeout(timer)
  }, [deleted])

  async function remove(song: Song) {
    await deleteSong(song.id)
    setSongs((current) => current?.filter((s) => s.id !== song.id))
    setDeleted(song)
  }

  async function undo(song: Song) {
    setDeleted(undefined)
    await restoreSong(song)
    setSongs(await listSongs())
  }

  const shown = songs?.filter((song) => matches(song, filter))

  return (
    <main className="library">
      <h1>Library</h1>
      <div className="actions">
        <button type="button" onClick={() => navigate(routes.paste)}>
          Paste a Song
        </button>
        <a href={routes.settings}>Settings</a>
      </div>
      {songs?.length === 0 && <p>No Songs yet.</p>}
      {songs && songs.length > 0 && (
        <>
          <input
            type="search"
            className="filter"
            aria-label="Filter"
            placeholder="Filter by title or artist"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
          {shown?.length === 0 && <p>No Songs match “{filter.trim()}”.</p>}
        </>
      )}
      <ul>
        {shown?.map((song) => (
          <li key={song.id}>
            <a href={routes.song(song.id)}>
              {song.title} <span className="artist">{song.artist}</span>
            </a>
            <button type="button" aria-label={`Delete ${song.title}`} onClick={() => remove(song)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
      {/* Mounted before it has text, so screen readers announce the toast. */}
      <div role="status" className="toast-region">
        {deleted && (
          <div className="toast">
            <span>Deleted {deleted.title}</span>
            <button type="button" onClick={() => undo(deleted)}>
              Undo
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
