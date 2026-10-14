import { LibraryView } from '../library/LibraryView'
import { PasteSongForm } from '../song/PasteSongForm'
import { SongView } from '../song/SongView'
import { useRoute } from './route'

export function App() {
  const route = useRoute()

  switch (route.name) {
    case 'library':
      return <LibraryView />
    case 'paste':
      return <PasteSongForm />
    case 'song':
      return <SongView key={route.id} id={route.id} />
  }
}
