import { useState, type FormEvent } from 'react'
import type { RouteHash } from '../app/route'
import type { NewSong } from './song'

/** What the form saves. `note` is there only when the form has a Note field; empty means none. */
export type SongFields = NewSong & { note?: string }

function readSong(form: FormData): SongFields {
  const note = form.get('note')
  return {
    title: String(form.get('title')).trim(),
    artist: String(form.get('artist')).trim(),
    lyrics: String(form.get('lyrics')),
    ...(note !== null && { note: String(note).trim() }),
  }
}

function problemWith(song: SongFields): string | undefined {
  if (!song.title || !song.artist) return 'Title and artist are required.'
  if (!song.lyrics.trim()) return 'Lyrics are empty.'
}

type SongFormProps = {
  /** Values the fields start with; empty when absent. */
  initial?: SongFields
  /** Shows a Note field. */
  withNote?: boolean
  cancelHref: RouteHash
  /** Saves the Song and moves on; a rejection keeps the form open with an error. */
  onSave: (song: SongFields) => Promise<void>
}

/** Title, artist and Lyrics, and optionally a Note, checked before they are saved. */
export function SongForm({ initial, withNote, cancelHref, onSave }: SongFormProps) {
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
      await onSave(song)
    } catch {
      setError('Could not save the Song. Try again.')
      setSaving(false)
    }
  }

  return (
    <form className="song-form" onSubmit={save}>
      <label>
        Title
        <input name="title" required autoComplete="off" defaultValue={initial?.title} />
      </label>
      <label>
        Artist
        <input name="artist" required autoComplete="off" defaultValue={initial?.artist} />
      </label>
      <label>
        Lyrics
        <textarea name="lyrics" required rows={16} spellCheck={false} defaultValue={initial?.lyrics} />
      </label>
      {withNote && (
        <label>
          Note
          <input name="note" autoComplete="off" placeholder="capo 2, slow intro" defaultValue={initial?.note} />
        </label>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="actions">
        <a href={cancelHref}>Cancel</a>
        <button type="submit" disabled={saving}>
          Save
        </button>
      </div>
    </form>
  )
}
