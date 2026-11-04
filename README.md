# lyrics-display

Song lyrics on screen while you play guitar. Paste lyrics or search for them, keep them in a library on your device, and the app fits each song into columns on the screen. It also prints one clean song per sheet.

Live at <https://lyrics-display.jpyepez.workers.dev>. It's a static PWA (Vite, React, TypeScript), so it works offline once installed.

## Lyrics

The repo ships no lyrics. Search fetches them from [LRCLIB](https://lrclib.net) in your browser, and your library stays in your browser's storage. There are no accounts and no server. Tests and screenshots use invented placeholder lyrics.

## Development

Uses [Bun](https://bun.sh).

```sh
bun install
bun run dev        # dev server
bun run test       # unit tests (Vitest)
bun run test:e2e   # end-to-end tests (Playwright)
bun run build
```

How the app is built: [docs/architecture.md](docs/architecture.md). How changes land: [docs/git-workflow.md](docs/git-workflow.md).

## License

[MIT](LICENSE)
