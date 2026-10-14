import { useSyncExternalStore } from 'react'

export type Route = { name: 'library' } | { name: 'paste' } | { name: 'song'; id: string }

/** A URL hash for one of the app's routes. Only `routes` makes these. */
export type RouteHash = string & { readonly __brand: 'RouteHash' }

export const routes = {
  library: '#/' as RouteHash,
  paste: '#/paste' as RouteHash,
  song: (id: string) => `#/song/${encodeURIComponent(id)}` as RouteHash,
}

function parseHash(hash: string): Route {
  if (hash === routes.paste) return { name: 'paste' }
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
