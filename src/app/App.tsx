import { useLayoutEffect } from 'react'
import { LibraryView } from '../library/LibraryView'
import { SearchView } from '../library/SearchView'
import { EditSongForm } from '../song/EditSongForm'
import { PasteSongForm } from '../song/PasteSongForm'
import { SongView } from '../song/SongView'
import { useRoute } from './route'
import { useThemeSetting } from './settings'
import { SettingsView } from './SettingsView'

/**
 * Puts the picked theme on the root, before paint, where src/index.css reads it. The browser
 * bar takes the page's background too; with System its colours go back to the ones in
 * index.html, which follow the system by media query.
 */
function useTheme() {
  const theme = useThemeSetting()
  useLayoutEffect(() => {
    const root = document.documentElement
    if (theme === 'system') delete root.dataset.theme
    else root.dataset.theme = theme
    const background = getComputedStyle(root).backgroundColor
    for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
      meta.dataset.systemColor ??= meta.content
      meta.content = theme === 'system' ? meta.dataset.systemColor : background
    }
  }, [theme])
}

export function App() {
  const route = useRoute()
  useTheme()

  switch (route.name) {
    case 'library':
      return <LibraryView />
    case 'paste':
      return <PasteSongForm title={route.title} artist={route.artist} />
    case 'search':
      return <SearchView />
    case 'settings':
      return <SettingsView />
    case 'song':
      return <SongView key={route.id} id={route.id} />
    case 'edit-song':
      return <EditSongForm key={route.id} id={route.id} />
  }
}
