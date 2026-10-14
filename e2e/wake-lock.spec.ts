import { expect, test, type Page } from '@playwright/test'

/**
 * Stands in for the Wake Lock API, which a headless browser cannot grant, and for tab
 * visibility. Like the real API, a lock held when the tab goes hidden is released.
 */
function fakeWakeLockAndVisibility() {
  let visibility: DocumentVisibilityState = 'visible'
  Object.defineProperty(document, 'visibilityState', { get: () => visibility })
  Object.defineProperty(document, 'hidden', { get: () => visibility === 'hidden' })

  type Sentinel = EventTarget & { released: boolean; type: string; release(): Promise<void> }
  const held = new Set<Sentinel>()
  const fake = window as unknown as { wakeLocksHeld: () => number; setVisibility: (v: DocumentVisibilityState) => void }
  fake.wakeLocksHeld = () => held.size
  fake.setVisibility = (next) => {
    visibility = next
    if (next === 'hidden') for (const sentinel of held) void sentinel.release()
    document.dispatchEvent(new Event('visibilitychange'))
  }

  Object.defineProperty(navigator, 'wakeLock', {
    value: {
      request: async (type: string) => {
        if (type !== 'screen' || visibility !== 'visible') throw new DOMException('Not allowed', 'NotAllowedError')
        const sentinel = new EventTarget() as Sentinel
        sentinel.released = false
        sentinel.type = 'screen'
        sentinel.release = async () => {
          if (sentinel.released) return
          sentinel.released = true
          held.delete(sentinel)
          sentinel.dispatchEvent(new Event('release'))
        }
        held.add(sentinel)
        return sentinel
      },
    },
  })
}

function wakeLocksHeld(page: Page) {
  return page.evaluate(() => (window as unknown as { wakeLocksHeld: () => number }).wakeLocksHeld())
}

function setVisibility(page: Page, visibility: DocumentVisibilityState) {
  return page.evaluate(
    (v) => (window as unknown as { setVisibility: (v: DocumentVisibilityState) => void }).setVisibility(v),
    visibility,
  )
}

async function pasteSong(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Lantern Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill('The kettle sings at dawn\nThe window hums along')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(fakeWakeLockAndVisibility)
})

test('the screen stays awake while a Song is open, and again after switching back to the tab', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  expect(await wakeLocksHeld(page)).toBe(0)

  await pasteSong(page)
  await expect.poll(() => wakeLocksHeld(page)).toBe(1)

  await setVisibility(page, 'hidden')
  expect(await wakeLocksHeld(page)).toBe(0)
  await setVisibility(page, 'visible')
  await expect.poll(() => wakeLocksHeld(page)).toBe(1)
})

test('leaving the Song lets the screen sleep', async ({ page }) => {
  await pasteSong(page)
  await expect.poll(() => wakeLocksHeld(page)).toBe(1)

  await page.getByRole('link', { name: 'Library' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  await expect.poll(() => wakeLocksHeld(page)).toBe(0)

  // The fake grants a lock within the same task, so it would show by the next check.
  await setVisibility(page, 'hidden')
  await setVisibility(page, 'visible')
  expect(await wakeLocksHeld(page)).toBe(0)
})

test('the screen holds one wake lock however often the tab reports it is visible', async ({ page }) => {
  await pasteSong(page)
  await expect.poll(() => wakeLocksHeld(page)).toBe(1)

  await setVisibility(page, 'visible')
  await setVisibility(page, 'visible')
  expect(await wakeLocksHeld(page)).toBe(1)

  await page.getByRole('link', { name: 'Library' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  await expect.poll(() => wakeLocksHeld(page)).toBe(0)
})

test('a Song missing from the Library does not keep the screen awake', async ({ page }) => {
  await page.goto('/#/song/missing')
  await expect(page.getByText('This Song is not in the Library.')).toBeVisible()
  expect(await wakeLocksHeld(page)).toBe(0)
})
