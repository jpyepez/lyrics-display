import { expect, test, type Page } from '@playwright/test'

const words = ['lantern', 'river', 'kettle', 'window', 'harbor', 'meadow', 'candle', 'pebble']

/** 40 invented Stanzas, "[Verse 1]" to "[Verse 40]", too many for one Screen at any size. */
const longLyrics = Array.from({ length: 40 }, (_, i) =>
  [
    `[Verse ${i + 1}]`,
    ...Array.from({ length: 4 }, (_, j) => `The ${words[(i + j) % 8]} hums along the ${words[(i + j + 3) % 8]} road`),
  ].join('\n'),
).join('\n\n')

async function pasteSong(page: Page, lyrics: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Long Road Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill(lyrics)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Long Road Song' })).toBeVisible()
}

const screenIndicator = (page: Page) => page.getByRole('status')

/** The Section Labels on the current Screen, in order. */
async function shownLabels(page: Page) {
  return page.getByRole('article', { name: 'Lyrics' }).getByRole('heading', { level: 2 }).allTextContents()
}

/** Every Stanza on the current Screen is fully inside the viewport, so nothing needs scrolling. */
async function expectAllVisible(page: Page) {
  const viewport = page.viewportSize()!
  const boxes = await page
    .getByRole('article', { name: 'Lyrics' })
    .getByRole('group')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON() as DOMRect))
  expect(boxes.length).toBeGreaterThan(0)
  for (const box of boxes) {
    expect(box.left).toBeGreaterThanOrEqual(0)
    expect(box.right).toBeLessThanOrEqual(viewport.width)
    expect(box.bottom).toBeLessThanOrEqual(viewport.height)
  }
}

test('a long Song Spills onto Screens that the keyboard moves between', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await pasteSong(page, longLyrics)

  await expect(screenIndicator(page)).toHaveText(/^1\/\d+$/)
  const count = Number((await screenIndicator(page).innerText()).split('/')[1])
  expect(count).toBeGreaterThan(1)
  const first = await shownLabels(page)
  expect(first[0]).toBe('Verse 1')
  await expectAllVisible(page)

  await page.keyboard.press('ArrowRight')
  await expect(screenIndicator(page)).toHaveText(`2/${count}`)
  const second = await shownLabels(page)
  expect(second).not.toContain('Verse 1')
  // At 1280×800 three columns of four Stanzas fill the first Screen; the second picks up after them.
  expect(first.at(-1)).toBe('Verse 12')
  expect(second[0]).toBe('Verse 13')
  await expectAllVisible(page)

  await page.keyboard.press('ArrowLeft')
  await expect(screenIndicator(page)).toHaveText(`1/${count}`)
  await page.keyboard.press('PageDown')
  await expect(screenIndicator(page)).toHaveText(`2/${count}`)
  await page.keyboard.press('PageUp')
  await expect(screenIndicator(page)).toHaveText(`1/${count}`)
  await page.keyboard.press('Space')
  await expect(screenIndicator(page)).toHaveText(`2/${count}`)
  await page.keyboard.press('ArrowUp')
  await expect(screenIndicator(page)).toHaveText(`1/${count}`)
  await page.keyboard.press('ArrowDown')
  await expect(screenIndicator(page)).toHaveText(`2/${count}`)

  // Past either end, the Screen stays put.
  for (let i = 2; i < count + 2; i++) await page.keyboard.press('ArrowRight')
  await expect(screenIndicator(page)).toHaveText(`${count}/${count}`)
  expect(await shownLabels(page)).toContain('Verse 40')
  for (let i = 0; i < count + 2; i++) await page.keyboard.press('ArrowLeft')
  await expect(screenIndicator(page)).toHaveText(`1/${count}`)
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true })

  test('tapping the right side shows the next Screen and the left side the previous one', async ({ page }) => {
    await pasteSong(page, longLyrics)
    await expect(screenIndicator(page)).toHaveText(/^1\/\d+$/)
    const count = Number((await screenIndicator(page).innerText()).split('/')[1])
    expect(count).toBeGreaterThan(2)

    await page.touchscreen.tap(350, 420)
    await expect(screenIndicator(page)).toHaveText(`2/${count}`)
    expect(await shownLabels(page)).not.toContain('Verse 1')
    await expectAllVisible(page)

    await page.touchscreen.tap(350, 420)
    await expect(screenIndicator(page)).toHaveText(`3/${count}`)

    await page.touchscreen.tap(40, 420)
    await expect(screenIndicator(page)).toHaveText(`2/${count}`)
  })
})

test('a Song that fits one Screen shows no Screen indicator', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await pasteSong(page, '[Verse 1]\nThe lantern hums along the river road')

  await expect(page.getByTestId('lyric-line')).toHaveText('The lantern hums along the river road')
  await expect(screenIndicator(page)).toBeHidden()
})
