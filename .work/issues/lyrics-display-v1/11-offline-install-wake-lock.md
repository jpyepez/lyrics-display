---
slice: 11
title: "Ready to use while playing: offline, install, persistent storage, wake lock"
status: done
blocked_by: [1]
parent_prd: lyrics-display-v1
---

**What to build:** the app works offline (service worker caches the app shell; the Library is already local), can be installed to a desktop or phone home screen, and asks the browser for persistent storage on first use. While a Song is open the screen stays awake via the Wake Lock API, and the lock is requested again when the tab becomes visible after switching apps.

- [x] App shell loads and the Library works with the network off
- [x] Web app manifest makes the app installable
- [x] Persistent storage requested on first use
- [x] Screen stays awake while a Song is open; lock re-acquired on return to the tab
- [x] Wake lock released when leaving the Song view
