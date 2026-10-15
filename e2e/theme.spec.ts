import { expect, test, type Page } from '@playwright/test'
import { verses } from './lyrics.ts'

const WHITE = 'rgb(255, 255, 255)'
const BLACK = 'rgb(0, 0, 0)'

/** The page's background colour, as the user sees it behind every view. */
async function pageBackground(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
}

/** The colour text takes when nothing sets its own. */
async function pageText(page: Page): Promise<string> {
  return page.evaluate(() => getComputedStyle(document.documentElement).color)
}

test('follows the system light or dark setting', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' })
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  expect(await pageBackground(page)).toBe(WHITE)
  expect(await pageText(page)).toBe('rgb(26, 26, 26)')

  await page.emulateMedia({ colorScheme: 'dark' })
  expect(await pageBackground(page)).toBe('rgb(18, 18, 18)')
  expect(await pageText(page)).toBe('rgb(230, 230, 230)')
})

test('a theme picked in Settings overrides the system and is remembered', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
  await expect(page.getByRole('radio', { name: 'System' })).toBeChecked()

  await page.getByRole('radio', { name: 'Light' }).check()
  expect(await pageBackground(page)).toBe(WHITE)

  await page.reload()
  await expect(page.getByRole('radio', { name: 'Light' })).toBeChecked()
  await page.getByRole('link', { name: 'Library' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  expect(await pageBackground(page)).toBe(WHITE)

  // Dark overrides a light system just the same, and System hands back to it.
  await page.emulateMedia({ colorScheme: 'light' })
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('radio', { name: 'Dark' }).check()
  expect(await pageBackground(page)).not.toBe(WHITE)
  await page.getByRole('radio', { name: 'System' }).check()
  expect(await pageBackground(page)).toBe(WHITE)
})

test('printing in dark mode is still black on white', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' })
  await page.goto('/')
  await page.getByRole('link', { name: 'Settings' }).click()
  await page.getByRole('radio', { name: 'Dark' }).check()
  await page.getByRole('link', { name: 'Library' }).click()
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Night Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill(verses(3))
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Night Song' })).toBeVisible()

  await page.emulateMedia({ media: 'print' })
  expect(await pageBackground(page)).toBe(WHITE)
  const sheet = page.getByRole('region', { name: /^Sheet 1 of/ })
  for (const text of [
    sheet.getByRole('heading', { name: 'Night Song' }),
    sheet.getByText('The Placeholders'),
    sheet.getByText('Verse 1'),
    sheet.getByText('The lantern hums along the window road').first(),
  ]) {
    expect(await text.evaluate((element) => getComputedStyle(element).color)).toBe(BLACK)
  }
})

test('buttons and fields use the same font as the rest of the app', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  const fontOf = (locator: ReturnType<Page['getByRole']>) =>
    locator.evaluate((element) => getComputedStyle(element).fontFamily)
  const appFont = await fontOf(page.getByRole('heading', { level: 1, name: 'Library' }))

  expect(await fontOf(page.getByRole('button', { name: 'Paste a Song' }))).toBe(appFont)
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  expect(await fontOf(page.getByRole('button', { name: 'Save' }))).toBe(appFont)
  expect(await fontOf(page.getByLabel('Lyrics'))).toBe(appFont)
})
