import { expect, test, type Page } from '@playwright/test'

async function pasteSong(page: Page, title: string, lyrics: string) {
  await page.goto('/')
  await page.getByRole('button', { name: 'Paste a Song' }).click()
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Artist').fill('The Placeholders')
  await page.getByLabel('Lyrics').fill(lyrics)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible()
}

/** Each Stanza on the Screen: its Section Label, if any, and its lines as written. */
async function shownStanzas(page: Page) {
  const result = []
  for (const stanza of await page.getByRole('article', { name: 'Lyrics' }).getByRole('group').all()) {
    const label = stanza.getByRole('heading', { level: 2 })
    result.push({
      label: (await label.count()) ? await label.textContent() : undefined,
      lines: await stanza.getByTestId('lyric-line').evaluateAll((els) => els.map((el) => (el as HTMLElement).innerText)),
    })
  }
  return result
}

test('an edited Song shows its new title, artist, Lyrics and Note, also after a reload', async ({ page }) => {
  await pasteSong(page, 'Kettle Song', 'The kettle sings at dawn\nThe kettle sings at dusk\nThe window hums along')

  await page.getByRole('link', { name: 'Edit' }).click()
  await expect(page.getByRole('heading', { level: 1, name: 'Edit Song' })).toBeVisible()
  await expect(page.getByLabel('Title')).toHaveValue('Kettle Song')
  await page.getByLabel('Title').fill('Kettle Song (Live)')
  await page.getByLabel('Artist').fill('The Stand-ins')
  await page
    .getByLabel('Lyrics')
    .fill('[Verse]\nThe kettle sings at dawn\nThe kettle sings at dusk\n\n\n[Chorus]\nThe window hums along')
  await page.getByLabel('Note').fill('capo 2, slow intro')
  await page.getByRole('button', { name: 'Save' }).click()

  const expectEdited = async () => {
    await expect(page.getByRole('heading', { level: 1, name: 'Kettle Song (Live)' })).toBeVisible()
    await expect(page.getByRole('main').getByText('The Stand-ins')).toBeVisible()
    await expect(page.getByRole('note')).toHaveText('capo 2, slow intro')
    // The Fit lays the Stanzas out once the Screen is measured.
    await expect(page.getByRole('article', { name: 'Lyrics' }).getByRole('group')).toHaveCount(2)
    expect(await shownStanzas(page)).toEqual([
      { label: 'Verse', lines: ['The kettle sings at dawn', 'The kettle sings at dusk'] },
      { label: 'Chorus', lines: ['The window hums along'] },
    ])
  }
  await expectEdited()

  await page.reload()
  await expectEdited()

  await page.getByRole('link', { name: 'Library' }).click()
  await expect(page.getByRole('link', { name: /Kettle Song \(Live\)/ })).toBeVisible()
  await expect(page.getByRole('link', { name: /^Kettle Song The Placeholders/ })).toHaveCount(0)
})

test('clearing the Note removes it from the Song view', async ({ page }) => {
  await pasteSong(page, 'Kettle Song', 'The kettle sings at dawn')
  await page.getByRole('link', { name: 'Edit' }).click()
  await page.getByLabel('Note').fill('capo 2')
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('note')).toHaveText('capo 2')

  await page.getByRole('link', { name: 'Edit' }).click()
  await expect(page.getByLabel('Note')).toHaveValue('capo 2')
  await page.getByLabel('Note').fill('   ')
  await page.getByRole('button', { name: 'Save' }).click()

  await expect(page.getByRole('heading', { level: 1, name: 'Kettle Song' })).toBeVisible()
  await expect(page.getByRole('note')).toHaveCount(0)
  await page.getByRole('link', { name: 'Edit' }).click()
  await expect(page.getByLabel('Note')).toHaveValue('')
})
