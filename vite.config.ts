/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // The service worker precaches the app shell so the app opens offline; the Library is
    // already on the device. Lyrics search stays network-only.
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      // Take over the page that installed it, so the first visit already works offline.
      workbox: { clientsClaim: true, skipWaiting: true },
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Lyrics Display',
        short_name: 'Lyrics',
        description: 'Song lyrics laid out to read while playing guitar.',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
})
