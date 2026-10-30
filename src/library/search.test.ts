import { afterEach, describe, expect, it, vi } from 'vitest'
import { searchLyrics } from './search'

function respond(status: number, headers: Record<string, string> = {}) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('[]', { status, headers })))
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

describe('searchLyrics failures', () => {
  it('treats a 503 with a retry-after in seconds like a rate limit', async () => {
    respond(503, { 'retry-after': '1' })
    expect(await searchLyrics('Kettle Waltz', '')).toEqual({ kind: 'rate-limited', retryAfterSeconds: 1 })
  })

  it('reads a 503 retry-after given as an HTTP date in whole seconds', async () => {
    vi.useFakeTimers({ now: new Date('2026-10-15T12:00:00Z') })
    respond(503, { 'retry-after': 'Thu, 15 Oct 2026 12:00:45 GMT' })
    expect(await searchLyrics('Kettle Waltz', '')).toEqual({ kind: 'rate-limited', retryAfterSeconds: 45 })
  })

  it('keeps a 503 without retry-after an error', async () => {
    respond(503)
    expect(await searchLyrics('Kettle Waltz', '')).toEqual({ kind: 'error' })
  })

  it('keeps a 500 an error, even with a retry-after', async () => {
    respond(500, { 'retry-after': '5' })
    expect(await searchLyrics('Kettle Waltz', '')).toEqual({ kind: 'error' })
  })

  it('still defaults a 429 without retry-after to 60 seconds', async () => {
    respond(429)
    expect(await searchLyrics('Kettle Waltz', '')).toEqual({ kind: 'rate-limited', retryAfterSeconds: 60 })
  })
})
