import { useState, type FormEvent } from 'react'
import { navigate, routes } from '../app/route'
import { addSong } from '../library/library'

export function PasteSongForm() {
  const [saving, setSaving] = useState(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSaving(true)
    const song = await addSong({
      title: String(form.get('title')).trim(),
      artist: String(form.get('artist')).trim(),
      lyrics: String(form.get('lyrics')),
    })
    navigate(routes.song(song.id))
  }

  return (
    <main className="paste">
      <h1>Paste a Song</h1>
      <form onSubmit={save}>
        <label>
          Title
          <input name="title" required autoComplete="off" />
        </label>
        <label>
          Artist
          <input name="artist" required autoComplete="off" />
        </label>
        <label>
          Lyrics
          <textarea name="lyrics" required rows={16} spellCheck={false} />
        </label>
        <div className="actions">
          <a href={routes.library}>Cancel</a>
          <button type="submit" disabled={saving}>
            Save
          </button>
        </div>
      </form>
    </main>
  )
}
