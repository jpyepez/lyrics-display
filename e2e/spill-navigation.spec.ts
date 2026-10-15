import { expect, test, type Page } from '@playwright/test'
import { longLyrics, verses } from './lyrics.ts'

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

test('one long line wraps in an extra column rather than Spilling the Song', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  // Wider than half the Screen at the minimum font, so two columns are never readable.
  const longLine = 'The lantern hums along the river road and the kettle sings by the window all night long'
  await pasteSong(page, verses(8).replace('[Verse 1]\n', `[Verse 1]\n${longLine}\n`))

  await expect(page.getByTestId('lyric-line').first()).toHaveText(longLine)
  await expect(screenIndicator(page)).toBeHidden()
  await expectAllVisible(page)
  const lefts = await page
    .getByRole('article', { name: 'Lyrics' })
    .getByRole('group')
    .evaluateAll((els) => new Set(els.map((el) => Math.round(el.getBoundingClientRect().left))).size)
  expect(lefts).toBe(2)
})

/** The width of the Stanzas on the current Screen, which is the width of their column. */
async function stanzaWidths(page: Page) {
  return page
    .getByRole('article', { name: 'Lyrics' })
    .getByRole('group')
    .evaluateAll((els) => [...new Set(els.map((el) => Math.round(el.getBoundingClientRect().width)))])
}

test('the last Screen keeps the same columns as the others, even when it fills fewer', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await pasteSong(page, longLyrics)
  await expect(screenIndicator(page)).toHaveText(/^1\/\d+$/)
  const count = Number((await screenIndicator(page).innerText()).split('/')[1])
  const [width] = await stanzaWidths(page)

  for (let i = 1; i < count; i++) await page.keyboard.press('ArrowRight')
  await expect(screenIndicator(page)).toHaveText(`${count}/${count}`)
  expect(await stanzaWidths(page)).toEqual([width])
})

test('changing the layout keeps the Stanza that was at the top of the Screen in view', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  await pasteSong(page, longLyrics)
  await expect(screenIndicator(page)).toHaveText(/^1\//)
  await page.keyboard.press('ArrowRight')
  await page.keyboard.press('ArrowRight')
  await expect(screenIndicator(page)).toHaveText(/^3\//)
  // Three columns of four Stanzas a Screen: the third Screen starts at Verse 25.
  expect((await shownLabels(page))[0]).toBe('Verse 25')

  const before = await screenIndicator(page).innerText()

  // Two columns hold fewer Stanzas a Screen, so the third Screen alone would now show earlier ones.
  await page.getByRole('button', { name: 'Fewer columns' }).click()
  await expect(screenIndicator(page)).not.toHaveText(before)
  expect(await shownLabels(page)).toContain('Verse 25')
})
