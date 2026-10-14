import { useEffect, useState } from 'react'
import { navigate, routes } from '../app/route'
import { saveLastBackup, useLastBackup } from '../app/settings'
import type { Song } from '../song/song'
import { downloadLibraryFile, isBackupDue } from './backup'
import { deleteSong, listSongs, matchesFilter, restoreSong } from './library'

/** How long the Undo toast stays after a delete. */
const UNDO_MS = 5000

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

  const lastBackup = useLastBackup()
  // Read once when the Library opens; the reminder only needs to be right to the day.
  const [openedAt] = useState(() => Date.now())
  const backupDue = isBackupDue(songs?.length ?? 0, lastBackup, openedAt)

  function putOffBackup() {
    try {
      saveLastBackup(Date.now())
    } catch {
      // Storage unavailable: the reminder stays until the user exports.
    }
  }

  const shown = songs?.filter((song) => matchesFilter(song, filter))

  return (
    <main className="library">
      <h1>Library</h1>
      <div className="actions">
        <button type="button" onClick={() => navigate(routes.search)}>
          Search for a Song
        </button>
        <button type="button" onClick={() => navigate(routes.paste)}>
          Paste a Song
        </button>
        <a href={routes.settings}>Settings</a>
      </div>
      {backupDue && (
        <section className="backup-nudge" aria-labelledby="backup-nudge-heading">
          <h2 id="backup-nudge-heading">Backup</h2>
          <p>Your Library is kept only in this browser, which may clear it. Export a copy now and then.</p>
          <div className="actions">
            <button type="button" onClick={downloadLibraryFile}>
              Export Library
            </button>
            <button type="button" onClick={putOffBackup}>
              Not now
            </button>
          </div>
        </section>
      )}
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
