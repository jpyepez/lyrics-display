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

async function openSettings(page: Page) {
  await page.goto('/#/settings')
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()
}

/** Exports the Library from Settings and returns the downloaded file's contents. */
async function exportLibrary(page: Page): Promise<string> {
  await openSettings(page)
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export Library' }).click(),
  ])
  expect(download.suggestedFilename()).toMatch(/\.json$/)
  const chunks: Buffer[] = []
  for await (const chunk of await download.createReadStream()) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

async function importLibrary(page: Page, contents: string) {
  await openSettings(page)
  await page.getByLabel('Import a Library file').setInputFiles({
    name: 'library.json',
    mimeType: 'application/json',
    buffer: Buffer.from(contents),
  })
}

/** The titles in the Library list, top to bottom. */
async function listedTitles(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  return page.getByRole('main').getByRole('listitem').getByRole('link')
}

test('the exported file holds every Song with its Note and Override', async ({ page }) => {
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  await page.getByRole('link', { name: 'Edit' }).click()
  await page.getByLabel('Note').fill('capo 2, slow intro')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('note')).toHaveText('capo 2, slow intro')
  await page.getByRole('button', { name: 'More columns' }).click()
  await expect(page.getByRole('button', { name: 'Reset to auto' })).toBeEnabled()
  await pasteSong(page, 'Candle Waltz', 'The Stand-ins')

  const file = JSON.parse(await exportLibrary(page))

  expect(file.version).toBe(1)
  expect(file.songs).toHaveLength(2)
  const meadow = file.songs.find((song: { title: string }) => song.title === 'Meadow Song')
  expect(meadow).toMatchObject({
    artist: 'The Placeholders',
    lyrics: 'The kettle sings at dawn\nThe window hums along',
    note: 'capo 2, slow intro',
    override: { columnCount: 2 },
  })
})

test('importing on another device adds the Songs, and importing again adds nothing', async ({ page, browser }) => {
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  await page.getByRole('link', { name: 'Edit' }).click()
  await page.getByLabel('Note').fill('capo 2, slow intro')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('note')).toHaveText('capo 2, slow intro')
  await pasteSong(page, 'Candle Waltz', 'The Stand-ins')
  const file = await exportLibrary(page)

  const otherDevice = await (await browser.newContext()).newPage()
  await pasteSong(otherDevice, 'candle waltz ', 'THE STAND-INS')
  await pasteSong(otherDevice, 'River Road', 'Pebble Choir')

  await importLibrary(otherDevice, file)
  await expect(otherDevice.getByRole('status')).toHaveText('Added 1 Song, skipped 1 duplicate.')
  await expect(await listedTitles(otherDevice)).toHaveText([
    'candle waltz THE STAND-INS',
    'Meadow Song The Placeholders',
    'River Road Pebble Choir',
  ])
  await otherDevice.getByRole('link', { name: /^Meadow Song/ }).click()
  await expect(otherDevice.getByRole('note')).toHaveText('capo 2, slow intro')

  await importLibrary(otherDevice, file)
  await expect(otherDevice.getByRole('status')).toHaveText('Added 0 Songs, skipped 2 duplicates.')
  await expect(await listedTitles(otherDevice)).toHaveCount(3)
})

test('a file that is not a sound Library file is rejected, and the Library is unchanged', async ({ page }) => {
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  const file = JSON.parse(await exportLibrary(page))
  const alert = page.getByRole('alert')

  await importLibrary(page, 'Meadow Song by The Placeholders')
  await expect(alert).toHaveText('This is not a Library file. Your Library is unchanged.')

  await importLibrary(page, JSON.stringify({ ...file, version: 2 }))
  await expect(alert).toHaveText(
    'This Library file is format version 2, which this app cannot read. Your Library is unchanged.',
  )

  const goodThenBad = [{ ...file.songs[0], title: 'River Road' }, { ...file.songs[0], lyrics: 42 }]
  await importLibrary(page, JSON.stringify({ ...file, songs: goodThenBad }))
  await expect(alert).toHaveText('Song 2 in this file is incomplete or damaged. Your Library is unchanged.')
  await expect(page.getByRole('status')).toBeEmpty()

  await expect(await listedTitles(page)).toHaveText(['Meadow Song The Placeholders'])
})

test('the Library asks for an export now and then', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-03-01T10:00:00'))
  await pasteSong(page, 'Meadow Song', 'The Placeholders')
  await listedTitles(page)
  const nudge = page.getByRole('region', { name: 'Backup' })
  await expect(nudge).toContainText('Your Library is kept only in this browser')

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    nudge.getByRole('button', { name: 'Export Library' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('lyrics-library-2026-03-01.json')
  await expect(nudge).toHaveCount(0)

  await page.clock.setFixedTime(new Date('2026-03-07T10:00:00'))
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  await expect(nudge).toHaveCount(0)

  await page.clock.setFixedTime(new Date('2026-03-09T10:00:00'))
  await page.reload()
  await page.getByRole('button', { name: 'Not now' }).click()
  await expect(nudge).toHaveCount(0)

  await page.clock.setFixedTime(new Date('2026-03-15T10:00:00'))
  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  await expect(nudge).toHaveCount(0)

  await page.clock.setFixedTime(new Date('2026-03-17T10:00:00'))
  await page.reload()
  await expect(nudge).toBeVisible()
})

test('an empty Library does not ask for an export', async ({ page }) => {
  await listedTitles(page)
  await expect(page.getByText('No Songs yet.')).toBeVisible()
  await expect(page.getByRole('region', { name: 'Backup' })).toHaveCount(0)
})
