import { useEffect } from 'react'

/**
 * Keeps the screen awake while the calling view is shown. The browser releases the lock
 * whenever the tab is hidden, so it is requested again each time the tab becomes visible.
 * Where the Wake Lock API is missing or refuses, the screen simply follows its own timeout.
 */
export function useWakeLock() {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return
    let active = true
    let sentinel: WakeLockSentinel | undefined

    function request() {
      if (document.visibilityState !== 'visible') return
      navigator.wakeLock.request('screen').then(
        (granted) => {
          // Left the view while the request was in flight: give the lock straight back.
          if (active) sentinel = granted
          else granted.release().catch(() => {})
        },
        () => {},
      )
    }

    request()
    document.addEventListener('visibilitychange', request)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', request)
      sentinel?.release().catch(() => {})
    }
  }, [])
}
