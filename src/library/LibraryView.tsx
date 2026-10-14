import { useEffect, useState } from 'react'
import { navigate, routes } from '../app/route'
import type { Song } from '../song/song'
import { listSongs } from './library'

export function LibraryView() {
  const [songs, setSongs] = useState<Song[]>()

  useEffect(() => {
    listSongs().then(setSongs)
  }, [])

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
      <ul>
        {songs?.map((song) => (
          <li key={song.id}>
            <a href={routes.song(song.id)}>
              {song.title} <span className="artist">{song.artist}</span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  )
}
