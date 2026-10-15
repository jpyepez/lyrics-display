import { useLayoutEffect } from 'react'
import { LibraryView } from '../library/LibraryView'
import { SearchView } from '../library/SearchView'
import { EditSongForm } from '../song/EditSongForm'
import { PasteSongForm } from '../song/PasteSongForm'
import { SongView } from '../song/SongView'
import { useRoute } from './route'
import { useThemeSetting } from './settings'
import { SettingsView } from './SettingsView'

/** Puts the picked theme on the root, before paint, where src/index.css reads it. */
function useTheme() {
  const theme = useThemeSetting()
  useLayoutEffect(() => {
    if (theme === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = theme
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
