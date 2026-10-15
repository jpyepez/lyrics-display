import { useSyncExternalStore } from 'react'

export type Route =
  | { name: 'library' }
  | { name: 'paste'; title?: string; artist?: string }
  | { name: 'search' }
  | { name: 'settings' }
  /** `alreadySaved` when an add found the Song already in the Library. */
  | { name: 'song'; id: string; alreadySaved?: boolean }
  | { name: 'edit-song'; id: string }

/** A URL hash for one of the app's routes. Only `routes` makes these. */
export type RouteHash = string & { readonly __brand: 'RouteHash' }

export const routes = {
  library: '#/' as RouteHash,
  paste: '#/paste' as RouteHash,
  /** Paste with title and artist already filled in, for a Song search could not provide. */
  pasteFor: (title: string, artist: string) => `#/paste?${new URLSearchParams({ title, artist })}` as RouteHash,
  search: '#/search' as RouteHash,
  settings: '#/settings' as RouteHash,
  song: (id: string) => `#/song/${encodeURIComponent(id)}` as RouteHash,
  /** The Song an add found already in the Library, to say so once. */
  songAlreadySaved: (id: string) => `#/song/${encodeURIComponent(id)}?already-saved` as RouteHash,
  editSong: (id: string) => `#/song/${encodeURIComponent(id)}/edit` as RouteHash,
}

function parseHash(hash: string): Route {
  if (hash === routes.paste) return { name: 'paste' }
  const paste = /^#\/paste\?(.*)$/.exec(hash)
  if (paste) {
    const query = new URLSearchParams(paste[1])
    return { name: 'paste', title: query.get('title') ?? '', artist: query.get('artist') ?? '' }
  }
  if (hash === routes.search) return { name: 'search' }
  if (hash === routes.settings) return { name: 'settings' }
  const edit = /^#\/song\/([^/]+)\/edit$/.exec(hash)
  if (edit) return { name: 'edit-song', id: decodeURIComponent(edit[1]) }
  const alreadySaved = /^#\/song\/([^/?]+)\?already-saved$/.exec(hash)
  if (alreadySaved) return { name: 'song', id: decodeURIComponent(alreadySaved[1]), alreadySaved: true }
  const song = /^#\/song\/(.+)$/.exec(hash)
  if (song) return { name: 'song', id: decodeURIComponent(song[1]) }
  return { name: 'library' }
}

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange)
  return () => window.removeEventListener('hashchange', onChange)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parseHash(hash)
}

export function navigate(hash: RouteHash) {
  window.location.hash = hash
}
