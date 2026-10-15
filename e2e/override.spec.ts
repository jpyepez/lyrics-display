import { expect, test, type Page } from '@playwright/test'
import { longLyrics } from './lyrics.ts'

async function pasteSong(page: Page, lyrics: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Lantern Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill(lyrics)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
}

/** The font size the Lyrics are shown at, in px. */
async function lyricsFontSize(page: Page): Promise<number> {
  const line = page.getByTestId('lyric-line').first()
  return Number.parseFloat(await line.evaluate((el) => getComputedStyle(el).fontSize))
}

/** How many Screens the Song takes, from the "x/y" indicator. */
async function screenCount(page: Page): Promise<number> {
  await expect(page.getByRole('status')).toHaveText(/^1\/\d+$/)
  return Number((await page.getByRole('status').innerText()).split('/')[1])
}

test.use({ viewport: { width: 1280, height: 800 } })

test('a font size Override is kept after a reload until reset to auto', async ({ page }) => {
  await pasteSong(page, '[Verse 1]\nThe lantern hums along the river road\nThe kettle sings by the window')
  await expect(page.getByRole('button', { name: 'Reset to auto' })).toBeDisabled()
  const auto = await lyricsFontSize(page)

  await page.getByRole('button', { name: 'Smaller text' }).click()
  await expect.poll(() => lyricsFontSize(page)).toBeLessThan(auto)
  const smaller = await lyricsFontSize(page)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
  await expect.poll(() => lyricsFontSize(page)).toBe(smaller)

  await page.getByRole('button', { name: 'Reset to auto' }).click()
  await expect.poll(() => lyricsFontSize(page)).toBe(auto)
  await expect(page.getByRole('button', { name: 'Reset to auto' })).toBeDisabled()

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
  await expect.poll(() => lyricsFontSize(page)).toBe(auto)
})

test('a column count Override that Spills is kept after a reload until reset to auto', async ({ page }) => {
  await pasteSong(page, longLyrics)
  const auto = await screenCount(page)

  // Fewer columns at the same minimum font hold fewer Stanzas per Screen.
  await page.getByRole('button', { name: 'Fewer columns' }).click()
  await expect.poll(() => screenCount(page)).toBeGreaterThan(auto)
  const fewer = await screenCount(page)

  // The pedal still turns the Screen after a click on a control.
  await page.keyboard.press('PageDown')
  await expect(page.getByRole('status')).toHaveText(`2/${fewer}`)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
  await expect.poll(() => screenCount(page)).toBe(fewer)

  await page.getByRole('button', { name: 'Reset to auto' }).click()
  await expect.poll(() => screenCount(page)).toBe(auto)
})

/** How many columns the Screen fills, from where its Stanzas start; read in one go, so a refit cannot land midway. */
async function columnCount(page: Page): Promise<number> {
  return page
    .getByRole('article', { name: 'Lyrics' })
    .getByRole('group')
    .evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().left))).size)
}

test('more columns can be asked for even where a long line then wraps', async ({ page }) => {
  const longLine = 'The lantern hums along the river road and the kettle sings by the window all night long'
  const stanzas = [`[Verse 1]\n${longLine}\nThe kettle sings`, '[Verse 2]\nThe meadow folds', '[Verse 3]\nThe harbor waits']
  await pasteSong(page, stanzas.join('\n\n'))
  await expect.poll(() => columnCount(page)).toBe(1)

  await expect(page.getByRole('button', { name: 'More columns' })).toBeEnabled()
  await page.getByRole('button', { name: 'More columns' }).click()
  await expect.poll(() => columnCount(page)).toBe(2)
  await expect(page.getByRole('button', { name: 'Reset to auto' })).toBeEnabled()
})
