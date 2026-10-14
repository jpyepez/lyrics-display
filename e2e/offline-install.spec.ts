import { expect, test, type Page } from '@playwright/test'

async function pasteSong(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Lantern Song')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill('The kettle sings at dawn\nThe window hums along')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
}

/** Persistence requests so far, kept across reloads like the browser's own answer would be. */
function persistRequests(page: Page) {
  return page.evaluate(() => Number(sessionStorage.getItem('persistRequests')))
}

test('the app asks the browser to keep the Library on first use, and only then', async ({ page }) => {
  // Stands in for the browser, which a test cannot answer through a real prompt. It says no,
  // as a user refusing the prompt would.
  await page.addInitScript(() => {
    navigator.storage.persisted = async () => false
    navigator.storage.persist = async () => {
      sessionStorage.setItem('persistRequests', String(Number(sessionStorage.getItem('persistRequests')) + 1))
      return false
    }
  })

  await pasteSong(page)
  await expect.poll(() => persistRequests(page)).toBe(1)

  await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
  await page.getByRole('link', { name: 'Library' }).click()
  await expect(page.getByRole('link', { name: /Lantern Song/ })).toBeVisible()
  expect(await persistRequests(page)).toBe(1)
})

test('with the network off, the app still loads and the Library still works', async ({ page, context }) => {
  await pasteSong(page)
  // The service worker caches the app shell once it controls the page.
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null)

  await context.setOffline(true)
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: 'Library' })).toBeVisible()
  await page.getByRole('link', { name: /Lantern Song/ }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Lantern Song' })).toBeVisible()
  await expect(page.getByTestId('lyric-line')).toHaveText(['The kettle sings at dawn', 'The window hums along'])
})

test('a web app manifest makes the app installable', async ({ page, request }) => {
  await page.goto('/')
  const href = await page.locator('link[rel="manifest"]').getAttribute('href')
  expect(href).toBeTruthy()

  const manifestUrl = new URL(href!, page.url())
  const manifest = await (await request.get(manifestUrl.href)).json()
  expect(manifest).toMatchObject({ name: 'Lyrics Display', display: 'standalone', start_url: '.' })
  for (const size of ['192x192', '512x512']) {
    const icon = manifest.icons.find((i: { sizes: string; purpose?: string }) => i.sizes === size && !i.purpose)
    const response = await request.get(new URL(icon.src, manifestUrl).href)
    expect(response.headers()['content-type']).toBe('image/png')
  }
})
