import { useState, type FormEvent } from 'react'
import { navigate, routes } from '../app/route'
import { addSong } from '../library/library'
import type { NewSong } from './song'

function readSong(form: FormData): NewSong {
  return {
    title: String(form.get('title')).trim(),
    artist: String(form.get('artist')).trim(),
    lyrics: String(form.get('lyrics')),
  }
}

function problemWith(song: NewSong): string | undefined {
  if (!song.title || !song.artist) return 'Title and artist are required.'
  if (!song.lyrics.trim()) return 'Lyrics are empty.'
}

export function PasteSongForm() {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string>()

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const song = readSong(new FormData(event.currentTarget))
    const problem = problemWith(song)
    setError(problem)
    if (problem) return

    setSaving(true)
    try {
      const saved = await addSong(song)
      navigate(routes.song(saved.id))
    } catch {
      setError('Could not save the Song. Try again.')
      setSaving(false)
    }
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
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
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
