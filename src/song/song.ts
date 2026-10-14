export type Song = {
  id: string
  title: string
  artist: string
  /** Raw Lyrics exactly as the user entered them; parsed into Stanzas when shown. */
  lyrics: string
  /** Replaces the automatic Fit on Screens; absent means auto. Sheets never use it. */
  override?: Override
  createdAt: number
  updatedAt: number
}

export type NewSong = Pick<Song, 'title' | 'artist' | 'lyrics'>

/** A per-Song font size, column count, or both, used on Screens instead of the automatic Fit. */
export type Override = {
  fontSize?: number
  columnCount?: number
}
