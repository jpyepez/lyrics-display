import { navigate, routes } from '../app/route'
import { addSong } from '../library/library'
import { SongForm, type SongFields } from './SongForm'

/** `title` and `artist` start the fields filled in, as when search sends the user here. */
export function PasteSongForm({ title = '', artist = '' }: { title?: string; artist?: string }) {
  async function save(song: SongFields) {
    const saved = await addSong(song)
    navigate(routes.song(saved.id))
  }

  return (
    <main className="song-form-view">
      <h1>Paste a Song</h1>
      <SongForm initial={{ title, artist, lyrics: '' }} cancelHref={routes.library} onSave={save} />
    </main>
  )
}
