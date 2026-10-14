import { LibraryView } from '../library/LibraryView'
import { PasteSongForm } from '../song/PasteSongForm'
import { SongView } from '../song/SongView'
import { useRoute } from './route'
import { SettingsView } from './SettingsView'

export function App() {
  const route = useRoute()

  switch (route.name) {
    case 'library':
      return <LibraryView />
    case 'paste':
      return <PasteSongForm />
    case 'settings':
      return <SettingsView />
    case 'song':
      return <SongView key={route.id} id={route.id} />
  }
}
