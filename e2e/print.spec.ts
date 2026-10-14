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

/** Each Sheet's Stanzas, as print media lays them out: label, line count, font size and place on the Sheet. */
async function printedStanzas(page: Page) {
  return sheets(page).evaluateAll((els) =>
    els.map((sheet) => {
      const box = sheet.getBoundingClientRect()
      return [...sheet.querySelectorAll('[role="group"]')].map((stanza) => {
        const inner = stanza.getBoundingClientRect()
        return {
          label: stanza.querySelector('h2')?.textContent,
          lines: stanza.querySelectorAll('.line').length,
          inside: inner.top >= box.top && inner.bottom <= box.bottom && inner.left >= box.left && inner.right <= box.right,
          fontSize: getComputedStyle(stanza.querySelector('.line')!).fontSize,
          at: [Math.round(inner.left - box.left), Math.round(inner.top - box.top)],
        }
      })
    }),
  )
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
  const lyrics = verses(3)
  await pasteSong(page, 'Short Song', lyrics)

  expect(await printedPageCount(page)).toBe(1)

  await page.emulateMedia({ media: 'print' })
  await expect(sheets(page)).toHaveCount(1)
  const allowed = new Set(['short song', 'the placeholders', ...lyrics.toLowerCase().split('\n')].map((l) => l.replace(/^\[|\]$/g, '')))
  const shown = await printedText(page)
  expect(shown.slice(0, 2)).toEqual(['short song', 'the placeholders'])
  expect(shown.filter((line) => !allowed.has(line))).toEqual([])
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

test('the Print button opens the browser Print, which prints the Sheets', async ({ page }) => {
  await pasteSong(page, 'Short Song', verses(3))
  await page.evaluate(() => {
    window.print = () => document.body.setAttribute('data-printed', '')
  })

  await page.getByRole('button', { name: 'Print' }).click()

  await expect(page.locator('body')).toHaveAttribute('data-printed')
  // The button gives the keys back, so a page-turner pedal still turns the Screen.
  await expect(page.getByRole('button', { name: 'Print' })).not.toBeFocused()
})
