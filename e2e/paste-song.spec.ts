import { expect, test, type Page } from '@playwright/test'

const lyrics = `[Verse 1]
Paper lanterns on the river
Drifting   slow past the mill


[Chorus]
Hey hey the lamp is low
Hey hey the lamp is low`

test('a pasted Song is saved, opened, and still in the Library after a reload', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Lantern Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill(lyrics)
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
  await expect(page.getByRole('main').getByText('The Placeholders')).toBeVisible()
  await expectSongLyrics(page)

  await page.goto('/')
  await page.reload()

  await page.getByRole('link', { name: /Lantern Song/ }).click()
  await expectSongLyrics(page)
})

async function expectSongLyrics(page: Page) {
  const stanzas = page.getByRole('article', { name: 'Lyrics' }).getByRole('group')
  await expect(stanzas).toHaveCount(2)

  await expect(stanzas.nth(0).getByRole('heading', { name: 'Verse 1' })).toBeVisible()
  await expect(stanzas.nth(1).getByRole('heading', { name: 'Chorus' })).toBeVisible()

  // Read raw text: Playwright's text matchers collapse whitespace, the Song view must not.
  const lines = await page.getByTestId('lyric-line').evaluateAll((els) =>
    els.map((el) => (el as HTMLElement).innerText),
  )
  expect(lines).toEqual([
    'Paper lanterns on the river',
    'Drifting   slow past the mill',
    'Hey hey the lamp is low',
    'Hey hey the lamp is low',
  ])
}

test('Lyrics with only blank lines are not saved', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Empty Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill('  \n\n   \n')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('alert')).toHaveText('Lyrics are empty.')

  await page.getByRole('link', { name: 'Cancel' }).click()
  await expect(page.getByText('No Songs yet.')).toBeVisible()
})

test('pasting a Song already in the Library opens the existing Song instead of adding a copy', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Lantern Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill('The first lantern burns')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()

  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('  lantern SONG ')
  await page.getByLabel('Artist').fill('the placeholders  ')
  await page.getByLabel('Lyrics').fill('A second lantern copy')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
  await expect(page.getByTestId('lyric-line')).toHaveText(['The first lantern burns'])

  await page.goto('/')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(1)
})
