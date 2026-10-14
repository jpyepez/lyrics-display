import { expect, test, type Page } from '@playwright/test'

const lyrics = `[Verse 1]
Paper lanterns on the river bend
Drifting slow past the old stone mill
Count the windows in the morning
None of them are open still

[Chorus]
Hey hey the lamp is burning low
Hey hey the lamp is burning low
Carry it down to the water
Let the evening take it slow

[Verse 2]
Salt along the kitchen windowsill
The kettle hums an older tune
Somebody left the gate unlatched
Underneath the paper moon

[Chorus]
Hey hey the lamp is burning low
Hey hey the lamp is burning low
Carry it down to the water
Let the evening take it slow`

async function pasteSong(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Lantern Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill(lyrics)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
}

/** Each Stanza's box on screen, in Lyrics order. */
async function stanzaBoxes(page: Page) {
  const stanzas = page.getByRole('article', { name: 'Lyrics' }).getByRole('group')
  await expect(stanzas).toHaveCount(4)
  return stanzas.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect))
}

async function lyricsFontSize(page: Page) {
  return page
    .getByRole('article', { name: 'Lyrics' })
    .evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
}

/** Every Stanza is fully inside the viewport, so nothing needs scrolling. */
async function expectAllVisible(page: Page) {
  const viewport = page.viewportSize()!
  for (const box of await stanzaBoxes(page)) {
    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.right).toBeLessThanOrEqual(viewport.width)
    expect(box.bottom).toBeLessThanOrEqual(viewport.height)
  }
}

test('a Song fills the window in columns and fits again when the window is resized', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await pasteSong(page)

  await expect.poll(async () => new Set((await stanzaBoxes(page)).map((box) => box.left)).size).toBeGreaterThan(1)
  await expectAllVisible(page)
  const wideFont = await lyricsFontSize(page)

  // A phone held upright: one column, at a smaller font that is still readable.
  await page.setViewportSize({ width: 390, height: 844 })

  await expect.poll(async () => new Set((await stanzaBoxes(page)).map((box) => box.left)).size).toBe(1)
  const narrowFont = await lyricsFontSize(page)
  expect(narrowFont).toBeLessThan(wideFont)
  expect(narrowFont).toBeGreaterThanOrEqual(20)
  await expectAllVisible(page)
})

test('title and artist are shown small above the Lyrics', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await pasteSong(page)

  const title = page.getByRole('heading', { level: 1, name: 'Lantern Song' })
  const titleSize = await title.evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
  expect(titleSize).toBeLessThan(await lyricsFontSize(page))
  await expect(page.getByRole('main').getByText('The Placeholders')).toBeVisible()
})
