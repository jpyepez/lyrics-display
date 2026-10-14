import { navigate, routes } from '../app/route'
import { addSong } from '../library/library'
import { SongForm, type SongFields } from './SongForm'

export function PasteSongForm() {
  async function save(song: SongFields) {
    const saved = await addSong(song)
    navigate(routes.song(saved.id))
  }

  return (
    <main className="song-form-view">
      <h1>Paste a Song</h1>
      <SongForm cancelHref={routes.library} onSave={save} />
    </main>
  )
}
