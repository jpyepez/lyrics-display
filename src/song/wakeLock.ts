import { useEffect } from 'react'

/**
 * Keeps the screen awake while `enabled`. The browser releases the lock whenever the tab is
 * hidden, so it is requested again each time the tab becomes visible; one lock at most is
 * held. Where the Wake Lock API is missing or refuses, the screen follows its own timeout.
 */
export function useWakeLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled || !('wakeLock' in navigator)) return
    let active = true
    let requesting = false
    let sentinel: WakeLockSentinel | undefined

    function requestWhileVisible() {
      if (document.visibilityState !== 'visible' || requesting || (sentinel && !sentinel.released)) return
      requesting = true
      navigator.wakeLock
        .request('screen')
        .then(
          (granted) => {
            // Left the view while the request was in flight: give the lock straight back.
            if (active) sentinel = granted
            else granted.release().catch(() => {})
          },
          () => {},
        )
        .finally(() => {
          requesting = false
        })
    }

    requestWhileVisible()
    document.addEventListener('visibilitychange', requestWhileVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', requestWhileVisible)
      sentinel?.release().catch(() => {})
    }
  }, [enabled])
}
