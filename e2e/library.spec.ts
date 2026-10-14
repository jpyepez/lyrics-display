import { expect, test, type Page } from '@playwright/test'

async function pasteSong(page: Page, title: string, artist: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Artist').fill(artist)
  await page.getByLabel('Lyrics').fill('The kettle sings at dawn\nThe window hums along')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

async function openLibrary(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
}

/** The titles in the Library list, top to bottom. */
function listedTitles(page: Page) {
  return page.getByRole('main').getByRole('listitem').getByRole('link')
}

test('the Library lists Songs by title, ignoring case', async ({ page }) => {
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  await pasteSong(page, 'candle Waltz', 'The Stand-ins')
  await pasteSong(page, 'River Road', 'The Placeholders')
  await pasteSong(page, 'Anchor Blues', 'The Stand-ins')

  await openLibrary(page)
  await expect(listedTitles(page)).toHaveText([
    'Anchor Blues The Stand-ins',
    'candle Waltz The Stand-ins',
    'Meadow Song The Placeholders',
    'River Road The Placeholders',
  ])
})

test('typing part of a title or artist filters the Library', async ({ page }) => {
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  await pasteSong(page, 'Candle Waltz', 'The Stand-ins')
  await pasteSong(page, 'River Road', 'Pebble Choir')
  await openLibrary(page)
  const filter = page.getByRole('searchbox', { name: 'Filter' })

  await filter.fill('WALTZ')
  await expect(listedTitles(page)).toHaveText(['Candle Waltz The Stand-ins'])

  await filter.fill('place')
  await expect(listedTitles(page)).toHaveText(['Meadow Song The Placeholders'])

  await filter.fill('o')
  await expect(listedTitles(page)).toHaveText(['Meadow Song The Placeholders', 'River Road Pebble Choir'])

  await filter.fill('accordion')
  await expect(listedTitles(page)).toHaveCount(0)
  await expect(page.getByText('No Songs match “accordion”.')).toBeVisible()
  await expect(page.getByText('No Songs yet.')).toHaveCount(0)

  await filter.fill('')
  await expect(listedTitles(page)).toHaveCount(3)
})

test('a deleted Song comes back with its Note and Override when Undo is tapped', async ({ page }) => {
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  await page.getByRole('link', { name: 'Edit' }).click()
  await page.getByLabel('Note').fill('capo 2, slow intro')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('note')).toHaveText('capo 2, slow intro')
  await page.getByRole('button', { name: 'Smaller text' }).click()
  await expect(page.getByRole('button', { name: 'Reset to auto' })).toBeEnabled()
  await pasteSong(page, 'Candle Waltz', 'The Stand-ins')

  await openLibrary(page)
  await page.getByRole('button', { name: 'Delete Meadow Song' }).click()
  await expect(listedTitles(page)).toHaveText(['Candle Waltz The Stand-ins'])
  await expect(page.getByRole('status')).toContainText('Deleted Meadow Song')

  await page.getByRole('button', { name: 'Undo' }).click()
  await expect(listedTitles(page)).toHaveText(['Candle Waltz The Stand-ins', 'Meadow Song The Placeholders'])
  await expect(page.getByRole('status')).toBeEmpty()

  await page.reload()
  await page.getByRole('link', { name: /^Meadow Song/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Meadow Song' })).toBeVisible()
  await expect(page.getByRole('note')).toHaveText('capo 2, slow intro')
  await expect(page.getByRole('button', { name: 'Reset to auto' })).toBeEnabled()
})

test('a deleted Song stays deleted once the Undo toast is gone', async ({ page }) => {
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  await openLibrary(page)
  await page.getByRole('button', { name: 'Delete Meadow Song' }).click()
  await expect(page.getByRole('status')).toContainText('Deleted Meadow Song')

  await expect(page.getByRole('status')).toBeEmpty({ timeout: 10_000 })
  await page.reload()
  await expect(page.getByText('No Songs yet.')).toBeVisible()
})
