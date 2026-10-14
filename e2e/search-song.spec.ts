import { expect, test, type Page, type Route } from '@playwright/test'

const SEARCH = 'https://lrclib.net/api/search**'

/** An LRCLIB search result, with invented placeholder lyrics. */
function result(trackName: string, artistName: string, albumName: string, plainLyrics: string | null) {
  return { id: 1, trackName, artistName, albumName, duration: 200, instrumental: plainLyrics === null, plainLyrics }
}

/** Answers every LRCLIB search with `handle`; any other LRCLIB call fails the test. */
async function stubSearch(page: Page, handle: (route: Route) => Promise<void>) {
  await page.route('**/lrclib.net/**', (route) => route.abort())
  await page.route(SEARCH, handle)
}

function respondWith(body: unknown) {
  return (route: Route) => route.fulfill({ json: body })
}

async function search(page: Page, title: string, artist: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Search for a Song' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Artist').fill(artist)
  await page.getByRole('button', { name: 'Search' }).click()
}

function results(page: Page) {
  return page.getByRole('main').getByRole('listitem')
}

test('search lists matches with title, artist and album, and picking one saves and opens it', async ({ page }) => {
  const queries: URLSearchParams[] = []
  await stubSearch(page, async (route) => {
    queries.push(new URL(route.request().url()).searchParams)
    await respondWith([
      result('Harbor Lights', 'The Placeholders', 'Low Tide', 'The harbor hums at night\nThe candle by the window\n\nThe meadow sleeps'),
      result('Harbor Lights', 'The Stand-ins', 'Live at the Mill', 'Another harbor line'),
    ])(route)
  })

  await search(page, 'Harbor Lights', 'Placeholders')
  expect(queries.map((q) => [q.get('track_name'), q.get('artist_name')])).toEqual([['Harbor Lights', 'Placeholders']])

  await expect(results(page)).toHaveText([
    /Harbor Lights.*The Placeholders.*Low Tide/,
    /Harbor Lights.*The Stand-ins.*Live at the Mill/,
  ])

  await results(page).nth(0).getByRole('button').click()
  await expect(page.getByRole('heading', { level: 1, name: 'Harbor Lights' })).toBeVisible()
  await expect(page.getByRole('main').getByText('The Placeholders')).toBeVisible()
  await expect(page.getByTestId('lyric-line')).toHaveText([
    'The harbor hums at night',
    'The candle by the window',
    'The meadow sleeps',
  ])

  await page.goto('/')
  await expect(page.getByRole('main').getByRole('listitem').getByRole('link')).toHaveText(['Harbor Lights The Placeholders'])
})

async function expectPasteFormFor(page: Page, title: string, artist: string) {
  await expect(page.getByRole('heading', { level: 1, name: 'Paste a Song' })).toBeVisible()
  await expect(page.getByLabel('Title')).toHaveValue(title)
  await expect(page.getByLabel('Artist')).toHaveValue(artist)
  await expect(page.getByLabel('Lyrics')).toHaveValue('')
}

test('a search with no results points to paste', async ({ page }) => {
  await stubSearch(page, respondWith([]))

  await search(page, 'Kettle Waltz', 'The Stand-ins')
  await expect(page.getByText('No Lyrics found for “Kettle Waltz”.')).toBeVisible()

  await page.getByRole('link', { name: 'Paste the Lyrics' }).click()
  await expectPasteFormFor(page, 'Kettle Waltz', 'The Stand-ins')
})

test('picking an instrumental result goes to paste and saves nothing', async ({ page }) => {
  await stubSearch(page, respondWith([result('Pebble Drift', 'The Placeholders', 'Quiet Hours', null)]))

  await search(page, 'Pebble Drift', '')
  await expect(results(page)).toHaveText([/Pebble Drift.*The Placeholders.*Quiet Hours.*Instrumental/])

  await results(page).nth(0).getByRole('link').click()
  await expectPasteFormFor(page, 'Pebble Drift', 'The Placeholders')

  await page.goto('/')
  await expect(page.getByText('No Songs yet.')).toBeVisible()
})

test('searching offline says so and points to paste', async ({ page, context }) => {
  // Routes run before the network, so the stub has to fail the way an offline browser does.
  await stubSearch(page, (route) => route.abort('internetdisconnected'))
  await page.goto('/')
  await context.setOffline(true)

  await page.getByRole('button', { name: 'Search for a Song' }).click()
  await page.getByLabel('Title').fill('Kettle Waltz')
  await page.getByRole('button', { name: 'Search' }).click()

  await expect(page.getByRole('alert')).toHaveText('You are offline, so search cannot reach LRCLIB. Paste the Lyrics')
  await page.getByRole('link', { name: 'Paste the Lyrics' }).click()
  await expectPasteFormFor(page, 'Kettle Waltz', '')
})

test('a rate-limited search waits as long as LRCLIB asks, without retrying', async ({ page }) => {
  let requests = 0
  await stubSearch(page, async (route) => {
    requests += 1
    await route.fulfill({
      status: 429,
      headers: { 'retry-after': '30', 'access-control-expose-headers': 'retry-after' },
      json: { message: 'Too many requests' },
    })
  })
  await page.clock.install()

  await search(page, 'Kettle Waltz', 'The Stand-ins')

  await expect(page.getByRole('alert')).toHaveText(
    'LRCLIB is busy. Try again in 30 seconds, or Paste the Lyrics',
  )
  const searchButton = page.getByRole('button', { name: 'Search' })
  await expect(searchButton).toBeDisabled()

  await page.clock.fastForward(29_000)
  await expect(searchButton).toBeDisabled()
  await page.clock.fastForward(1_000)
  await expect(searchButton).toBeEnabled()
  expect(requests).toBe(1)

  await page.getByRole('link', { name: 'Paste the Lyrics' }).click()
  await expectPasteFormFor(page, 'Kettle Waltz', 'The Stand-ins')
})

test('a failing search says so and points to paste', async ({ page }) => {
  await stubSearch(page, (route) => route.fulfill({ status: 500, body: 'Internal Server Error' }))

  await search(page, 'Kettle Waltz', 'The Stand-ins')

  await expect(page.getByRole('alert')).toHaveText('Search is not working right now. Paste the Lyrics')
  await page.getByRole('link', { name: 'Paste the Lyrics' }).click()
  await expectPasteFormFor(page, 'Kettle Waltz', 'The Stand-ins')
})

test('picking a result already in the Library opens the existing Song instead of adding a copy', async ({ page }) => {
  await stubSearch(page, respondWith([result(' harbor LIGHTS', 'the placeholders ', 'Low Tide', 'A fetched harbor line')]))
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill('Harbor Lights')
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill('My own harbor line')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Harbor Lights' })).toBeVisible()

  await search(page, 'Harbor Lights', '')
  await results(page).nth(0).getByRole('button').click()

  await expect(page.getByRole('heading', { level: 1, name: 'Harbor Lights' })).toBeVisible()
  await expect(page.getByTestId('lyric-line')).toHaveText(['My own harbor line'])
  await page.goto('/')
  await expect(page.getByRole('main').getByRole('listitem')).toHaveCount(1)
})
