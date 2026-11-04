# Browser verification

Tests show the code does what the tests check; this shows the app does what the ticket asked, in a real browser.

## Steps

1. **Serve the build.** `bun run build`, then `bun run preview --port 4174 --strictPort` in the background (4173 belongs to Playwright). Done when `http://localhost:4174/` answers 200.
2. **Open a clean page.** Chrome DevTools MCP `new_page` with an `isolatedContext`, so the Library starts empty and the user's own browser data stays untouched.
   - No DevTools MCP (a CI runner), or DevTools says the browser profile is already in use: take the [headless route](#headless-route) for steps 2 to 5 instead. Leave a browser another session owns running.
3. **Walk every changed path by hand.** Each acceptance criterion of the ticket, or the bug's repro steps, plus one edge case per input the change touches. After each navigation, wait for the target view's heading or landmark before a snapshot or screenshot; the hash route renders a tick after the click. Done when every criterion and edge case has been walked.
4. **Look at it.** Screenshot every view the change touches at desktop (1280×800) and phone (390×844) width, and read the screenshots. Done when each one shows what the ticket describes.
5. **Check the console.** `list_console_messages`: done when every error and warning has been read and goes in the report.
6. **Capture screenshots for the PR.** Once the PR is open, write a throwaway Playwright script in the scratchpad, as in the [headless route](#headless-route). It seeds the Library with invented Songs and walks each path from step 3, saving one screenshot per state to a folder: every path at desktop width, plus the main ones at phone width. Name the files in walk order (`01-empty-desktop.png`, `02-…`). Read them, then write the comment body to `comment.md` in the same folder and post it with `gh pr comment <pr> --body-file <folder>/comment.md`, plus one `--attach '<folder>/<file>.png#<alt>'` per screenshot (gh 2.103 or later; up to 50 files). The body holds:
   - a line on the setup (preview build, fresh context, the seeded Songs) and the console result;
   - a table: what was done or typed, what showed, what it checks;
   - the images in a two-column table, `![<alt>](./<file>.png)`, desktop and phone of each state side by side. gh uploads each attached file and points its reference at the upload.

   Skip this step for a change with nothing to see on screen. Done when the comment renders on the PR.
7. **Clean up.** Close the page and stop the preview server, unless the user wants it left running. Done when port 4174 is free.

## Report

List each path walked with what you saw, every console error and warning, and anything that looks wrong but is outside the ticket (name the ticket that owns it, if any). A mismatch that a retry with a proper wait clears was timing, and is reported as such.

## Headless route

For a runner with no DevTools MCP, such as the Implement workflow in CI. Serve the build on 4174 as in step 1, then drive steps 2 to 5 with a throwaway Playwright script outside the repo (the scratchpad, or the output folder in CI).

- **Import Playwright by absolute path:** `<repo>/node_modules/@playwright/test/index.mjs`. An ES module resolves bare imports from its own folder, not the working directory, so `import "@playwright/test"` fails from outside the repo. Chromium must be installed (`bunx playwright install chromium`; CI does this already).
- **Start clean:** `chromium.launch()` and a new context, so the Library starts empty. Seed it with invented Songs, never real lyrics.
- **Stub LRCLIB:** `page.route('**/lrclib.net/**', ...)` with invented results, as `e2e/search-song.spec.ts` does. CI blocks every host off its allowlist, LRCLIB included, so an unstubbed search only shows the error state.
- **Collect the console:** `page.on('console')` and `page.on('pageerror')`, and report every error and warning, as in step 5.
- **Screenshots:** desktop (1280×800) and phone (390×844), named in walk order. Read every one.

In CI the agent has no `gh`: it saves at most 10 screenshots to the `screenshots` folder of its output folder, and the workflow posts them on the PR in place of step 6.
