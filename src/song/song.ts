export type Song = {
  id: string
  title: string
  artist: string
  /** Raw Lyrics exactly as the user entered them; parsed into Stanzas when shown. */
  lyrics: string
  createdAt: number
  updatedAt: number
}

export type NewSong = Pick<Song, 'title' | 'artist' | 'lyrics'>
