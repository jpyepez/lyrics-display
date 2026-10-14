import { expect, test, type Page } from '@playwright/test'
import { verses } from './lyrics.ts'

async function pasteSong(page: Page, title: string, lyrics: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill(lyrics)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

/** How many pages the browser prints, read from the PDF it renders with the page's own page size. */
async function printedPageCount(page: Page): Promise<number> {
  const pdf = await page.pdf({ preferCSSPageSize: true })
  return pdf.toString('latin1').match(/\/Type\s*\/Page\b(?!s)/g)?.length ?? 0
}

const sheets = (page: Page) => page.getByRole('region', { name: /^Sheet/ })

/** Each Sheet's Stanzas, as print media lays them out: label, line count, font size and place in the Lyrics box. */
async function printedStanzas(page: Page) {
  const result = []
  for (const sheet of await sheets(page).all()) {
    // Inside the Lyrics box, which clips anything the Fit let run over.
    const box = (await sheet.getByRole('article', { name: 'Lyrics' }).boundingBox())!
    const stanzas = []
    for (const stanza of await sheet.getByRole('group').all()) {
      const inner = (await stanza.boundingBox())!
      const lines = stanza.getByTestId('sheet-line')
      stanzas.push({
        label: await stanza.getByRole('heading', { level: 2 }).textContent(),
        lines: await lines.count(),
        inside:
          inner.y >= box.y &&
          inner.y + inner.height <= box.y + box.height &&
          inner.x >= box.x &&
          inner.x + inner.width <= box.x + box.width,
        fontSize: await lines.first().evaluate((el) => getComputedStyle(el).fontSize),
        at: [Math.round(inner.x - box.x), Math.round(inner.y - box.y)],
      })
    }
    result.push(stanzas)
  }
  return result
}

/** The text print media shows, one entry per line, lower-cased (Section Labels print in capitals). */
async function printedText(page: Page): Promise<string[]> {
  const text = await page.locator('body').innerText()
  return text
    .split('\n')
    .map((line) => line.trim().toLowerCase())
    .filter(Boolean)
}

test.use({ viewport: { width: 1280, height: 800 } })

test('a short Song prints as one Sheet with only its title, artist and Lyrics', async ({ page }) => {
  await pasteSong(page, 'Short Song', verses(3))

  expect(await printedPageCount(page)).toBe(1)

  await page.emulateMedia({ media: 'print' })
  await expect(sheets(page)).toHaveCount(1)
  expect(await printedText(page)).toEqual([
    'short song',
    'the placeholders',
    'verse 1',
    'the lantern hums along the window road',
    'the river hums along the harbor road',
    'the kettle hums along the meadow road',
    'the window hums along the candle road',
    'verse 2',
    'the river hums along the harbor road',
    'the kettle hums along the meadow road',
    'the window hums along the candle road',
    'the harbor hums along the pebble road',
    'verse 3',
    'the kettle hums along the meadow road',
    'the window hums along the candle road',
    'the harbor hums along the pebble road',
    'the meadow hums along the lantern road',
  ])
})

test('a long Song Spills onto two Sheets marked 1/2 and 2/2, no Stanza split', async ({ page }) => {
  await pasteSong(page, 'Long Song', verses(24))

  expect(await printedPageCount(page)).toBe(2)

  await page.emulateMedia({ media: 'print' })
  await expect(sheets(page)).toHaveCount(2)
  await expect(sheets(page).nth(0)).toContainText('1/2')
  await expect(sheets(page).nth(1)).toContainText('2/2')
  const stanzas = (await printedStanzas(page)).flat()
  expect(stanzas.map((stanza) => stanza.label)).toEqual(Array.from({ length: 24 }, (_, i) => `Verse ${i + 1}`))
  for (const stanza of stanzas) expect(stanza).toMatchObject({ lines: 4, inside: true })
})

test('a Screen Override has no effect on the Sheets', async ({ page }) => {
  await pasteSong(page, 'Long Song', verses(24))
  await page.emulateMedia({ media: 'print' })
  const auto = await printedStanzas(page)
  // Back to no emulation: emulated screen media would also reach the PDF.
  await page.emulateMedia({ media: null })

  await page.getByRole('button', { name: 'Fewer columns' }).click()
  await expect(page.getByRole('button', { name: 'Reset to auto' })).toBeEnabled()
  await page.getByRole('button', { name: 'Larger text' }).click()

  expect(await printedPageCount(page)).toBe(2)
  await page.emulateMedia({ media: 'print' })
  expect(await printedStanzas(page)).toEqual(auto)
})

test('the Print button opens the browser Print', async ({ page }) => {
  await pasteSong(page, 'Short Song', verses(3))
  await page.evaluate(() => {
    window.print = () => document.body.setAttribute('data-printed', '')
  })

  await page.getByRole('button', { name: 'Print' }).click()

  await expect(page.locator('body')).toHaveAttribute('data-printed')
  // The button gives the keys back, so a page-turner pedal still turns the Screen.
  await expect(page.getByRole('button', { name: 'Print' })).not.toBeFocused()
})

test('a long title wraps in the Sheet header and keeps the artist and Sheet number in view', async ({ page }) => {
  const title = 'A Very Long Placeholder Title About Lanterns, Rivers, Kettles, Windows, Harbors and Meadows'
  await pasteSong(page, title, verses(24))

  expect(await printedPageCount(page)).toBe(2)

  await page.emulateMedia({ media: 'print' })
  const first = sheets(page).nth(0)
  const sheetBox = (await first.boundingBox())!
  const lyricsTop = (await first.getByRole('group').first().boundingBox())!.y
  // Above the Lyrics and inside the Sheet, so neither cut off nor covered.
  for (const text of [title, 'The Placeholders', '1/2']) {
    const box = (await first.getByText(text, { exact: true }).boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(sheetBox.x + sheetBox.width)
    expect(box.y + box.height).toBeLessThanOrEqual(lyricsTop)
  }
  for (const stanza of (await printedStanzas(page)).flat()) expect(stanza).toMatchObject({ lines: 4, inside: true })
})
