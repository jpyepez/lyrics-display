import { useEffect, useState } from 'react'
import { navigate, routes } from '../app/route'
import { getSong, updateSong } from '../library/library'
import { SongForm, type SongFields } from './SongForm'
import type { Song } from './song'

export function EditSongForm({ id }: { id: string }) {
  const [song, setSong] = useState<Song | null>()

  useEffect(() => {
    getSong(id).then((found) => setSong(found ?? null))
  }, [id])

  if (song === undefined) return null
  if (song === null) {
    return (
      <main className="song-form-view">
        <p>This Song is not in the Library.</p>
        <a href={routes.library}>Back to Library</a>
      </main>
    )
  }

  /** Keeps the rest of the Song (Override, created time); an empty Note removes it. */
  async function save({ note, ...fields }: SongFields) {
    if (!song) return
    const next: Song = { ...song, ...fields, note }
    if (!note) delete next.note
    await updateSong(next)
    navigate(routes.song(song.id))
  }

  return (
    <main className="song-form-view">
      <h1>Edit Song</h1>
      <SongForm initial={song} withNote cancelHref={routes.song(song.id)} onSave={save} />
    </main>
  )
}
