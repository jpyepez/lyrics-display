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

async function openSettings(page: Page) {
  await page.goto('/')
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
}

/** Each printed page's size in pt, read from the PDF the browser renders with the page's own page size. */
async function printedPageSizes(page: Page): Promise<[number, number][]> {
  const pdf = (await page.pdf({ preferCSSPageSize: true })).toString('latin1')
  return [...pdf.matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])])
}

/** How many columns the first Sheet lays its Stanzas out in, as print media shows it. */
async function firstSheetColumnCount(page: Page): Promise<number> {
  await page.emulateMedia({ media: 'print' })
  const sheet = page.getByRole('region', { name: /^Sheet 1 of/ })
  const lefts = new Set<number>()
  for (const stanza of await sheet.getByRole('group').all()) lefts.add(Math.round((await stanza.boundingBox())!.x))
  await page.emulateMedia({ media: null })
  return lefts.size
}

test.use({ viewport: { width: 1280, height: 800 } })

test('paper defaults to A4 portrait', async ({ page }) => {
  await openSettings(page)
  await expect(page.getByRole('radio', { name: 'A4' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Portrait' })).toBeChecked()

  await pasteSong(page, 'Short Song', verses(3))
  const [[width, height]] = await printedPageSizes(page)
  // A4 is 210 × 297 mm: 595.3 × 841.9 pt.
  expect(width).toBeCloseTo(595.3, 0)
  expect(height).toBeCloseTo(841.9, 0)
})

test('Letter landscape is remembered and the Sheets print on it, with more columns', async ({ page }) => {
  await pasteSong(page, 'Long Song', verses(24))
  const portraitColumns = await firstSheetColumnCount(page)

  await openSettings(page)
  await page.getByRole('radio', { name: 'Letter' }).check()
  await page.getByRole('radio', { name: 'Landscape' }).check()
  await page.reload()
  await expect(page.getByRole('radio', { name: 'Letter' })).toBeChecked()
  await expect(page.getByRole('radio', { name: 'Landscape' })).toBeChecked()

  await page.getByRole('link', { name: 'Library' }).click()
  await page.getByRole('link', { name: /Long Song/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Long Song' })).toBeVisible()

  const sizes = await printedPageSizes(page)
  expect(sizes.length).toBeGreaterThan(0)
  // Letter is 8.5 × 11 in: on its side, 792 × 612 pt.
  for (const [width, height] of sizes) {
    expect(width).toBeCloseTo(792, 0)
    expect(height).toBeCloseTo(612, 0)
  }
  expect(await firstSheetColumnCount(page)).toBeGreaterThan(portraitColumns)
})

test('no print hint for browsers other than Firefox', async ({ page }) => {
  await openSettings(page)
  await expect(page.getByText(/Firefox/)).toHaveCount(0)
})

test.describe('in Firefox', () => {
  test.use({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:140.0) Gecko/20100101 Firefox/140.0' })

  test('settings show how to turn off its print headers and footers', async ({ page }) => {
    await openSettings(page)
    await expect(page.getByText(/headers and footers/)).toBeVisible()
  })
})
