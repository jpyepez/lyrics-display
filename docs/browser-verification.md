# Browser verification

Tests show the code does what the tests check; this shows the app does what the ticket asked, in a real browser.

## Steps

1. **Serve the build.** `bun run build`, then `bun run preview --port 4174 --strictPort` in the background (4173 belongs to Playwright). Done when `http://localhost:4174/` answers 200.
2. **Open a clean page.** Chrome DevTools MCP `new_page` with an `isolatedContext`, so the Library starts empty and the user's own browser data stays untouched.
   - If DevTools reports the browser profile is already in use, another session owns it: leave that browser running and drive the same path with a throwaway Playwright script in the scratchpad (`chromium.launch()`, screenshots to files, run from the repo root so `@playwright/test` resolves).
3. **Walk every changed path by hand.** Each acceptance criterion of the ticket, or the bug's repro steps, plus one edge case per input the change touches. After each navigation, wait for the target view's heading or landmark before a snapshot or screenshot; the hash route renders a tick after the click. Done when every criterion and edge case has been walked.
4. **Look at it.** Screenshot every view the change touches at desktop (1280×800) and phone (390×844) width, and read the screenshots. Done when each one shows what the ticket describes.
5. **Check the console.** `list_console_messages`: done when every error and warning has been read and goes in the report.
6. **Clean up.** Close the page and stop the preview server, unless the user wants it left running. Done when port 4174 is free.

## Report

List each path walked with what you saw, every console error and warning, and anything that looks wrong but is outside the ticket (name the ticket that owns it, if any). A mismatch that a retry with a proper wait clears was timing, and is reported as such.
