import { describe, expect, it } from 'vitest'
import fallback from '../src/data/stats-fallback.json' with { type: 'json' }
import { formatCount, getStats } from '../src/lib/stats.ts'

type Route = { status: number; body: unknown }
function fakeFetch(routes: Record<string, Route | Error>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input)
    const key = Object.keys(routes).find((k) => url.includes(k))
    const route = key ? routes[key] : { status: 404, body: {} }
    if (route instanceof Error) throw route
    return new Response(JSON.stringify(route?.body), { status: route?.status ?? 404 })
  }) as typeof fetch
}

const repo = { status: 200, body: { stargazers_count: 12 } }
const releases = {
  status: 200,
  body: [
    { tag_name: 'v0.14.0', published_at: '2026-11-01T06:01:08Z', draft: false, prerelease: false, assets: [{ download_count: 300 }] },
    { tag_name: 'v0.13.0', published_at: '2026-10-25T08:00:00Z', draft: false, prerelease: false, assets: [{ download_count: 210 }] },
  ],
}

describe('getStats', () => {
  it('liest Stars, Downloads, Version und Datum von GitHub', async () => {
    const stats = await getStats(fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': repo }))
    expect(stats).toEqual({ downloads: 510, stars: 12, version: '0.14.0', releasedAt: '2026-11-01', highlights: [] })
  })

  it('nimmt die Rückfallwerte, wenn GitHub nicht erreichbar ist', async () => {
    const stats = await getStats(fakeFetch({ '/releases': new Error('offline'), '/repos/speedone/mietfuchs': new Error('offline') }))
    expect(stats).toEqual(fallback)
  })

  it('nimmt die Rückfallwerte bei einem Rate-Limit (403)', async () => {
    const limited = { status: 403, body: { message: 'API rate limit exceeded' } }
    const stats = await getStats(fakeFetch({ '/releases': limited, '/repos/speedone/mietfuchs': limited }))
    expect(stats).toEqual(fallback)
  })

  it('mischt bei einer Teilantwort: Downloads von GitHub, Stars aus dem Rückfall', async () => {
    const stats = await getStats(fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': { status: 500, body: {} } }))
    expect(stats.downloads).toBe(510)
    expect(stats.stars).toBe(fallback.stars)
  })

  it('zeigt nie weniger Downloads als der Rückfall, wenn die Antwort leer ist', async () => {
    const stats = await getStats(fakeFetch({ '/releases': { status: 200, body: [] }, '/repos/speedone/mietfuchs': repo }))
    expect(stats.downloads).toBe(fallback.downloads)
    expect(stats.version).toBe(fallback.version)
  })
})

describe('cachedStats', () => {
  it('fragt GitHub beim Bauen nur einmal, egal wie viele Seiten die Zahlen brauchen', async () => {
    let calls = 0
    const counting = (async (input: string | URL | Request) => { calls++; return fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': repo })(input) }) as typeof fetch
    const { createStatsCache } = await import('../src/lib/stats.ts')
    const cached = createStatsCache(counting)
    const [a, b] = await Promise.all([cached(), cached()])
    await cached()
    expect(a).toEqual(b)
    expect(calls).toBe(2) // ein Aufruf für das Repo, einer für die erste Seite der Releases
  })
})

describe('formatCount', () => {
  it('schreibt Tausender mit Punkt', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(510)).toBe('510')
  })
})
