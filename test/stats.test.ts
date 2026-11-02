import { describe, expect, it } from 'vitest'
import fallback from '../src/data/stats-fallback.json' with { type: 'json' }
import { dockerReleaseDownloads, formatCount, getStats, isProgramFile } from '../src/lib/stats.ts'

type Route = { status: number; body: unknown }
function fakeFetch(routes: Record<string, Route | Error>): typeof fetch {
  return (async (input: string | URL | Request) => {
    const url = String(input instanceof Request ? input.url : input)
    const key = Object.keys(routes).find((k) => url.includes(k))
    const route = key ? routes[key] : { status: 404, body: {} }
    if (route instanceof Error) throw route
    const body = typeof route?.body === 'string' ? route.body : JSON.stringify(route?.body)
    return new Response(body, { status: route?.status ?? 404 })
  }) as typeof fetch
}

const repo = { status: 200, body: { stargazers_count: 12 } }

// Ausschnitt der Versionsliste von ghcr.io/speedone/mietfuchs, wie GitHub sie ausliefert
const row = (tags: string[], n: string): string =>
  `<li data-view-component="true" class="Box-row"><div>${tags.map((t) => `<a class="Label mr-1 mb-2" href="/x?tag=${t}">${t}</a>`).join('')}</div>
   <span class="d-flex"><svg class="octicon octicon-download"></svg>
        ${n}
        <span class="sr-only">Version downloads</span></span></li>`
const versionsPage = (rows: string[]): Route => ({ status: 200, body: `<ul>${rows.join('')}</ul>` })
const docker = versionsPage([row(['main'], '40'), row(['latest', '0.14.1', '0.14'], '17'), row(['0.14.0'], '8'), row(['0.10.0-rc.1'], '5'), row(['0.9', '0.9.0'], '1,012')])
const dockerEmpty = versionsPage([])
const releases = {
  status: 200,
  body: [
    { tag_name: 'v0.14.0', published_at: '2026-11-01T06:01:08Z', draft: false, prerelease: false, assets: [{ name: 'mietfuchs-win.exe', download_count: 300 }] },
    { tag_name: 'v0.13.0', published_at: '2026-10-25T08:00:00Z', draft: false, prerelease: false, assets: [{ name: 'mietfuchs-linux.tar.gz', download_count: 210 }] },
  ],
}

describe('getStats', () => {
  it('liest Stars, Downloads, Version und Datum von GitHub', async () => {
    const stats = await getStats(fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': repo, 'page=1': docker, 'page=2': dockerEmpty }))
    expect(stats).toEqual({ downloads: 510 + 17 + 8 + 1012, stars: 12, version: '0.14.0', releasedAt: '2026-11-01', highlights: [] })
  })

  const offlineTotal = fallback.downloads + fallback.dockerDownloads
  it('nimmt die Rückfallwerte, wenn GitHub nicht erreichbar ist', async () => {
    const stats = await getStats(fakeFetch({ '/releases': new Error('offline'), '/repos/speedone/mietfuchs': new Error('offline'), '/versions': new Error('offline') }))
    expect(stats).toEqual({ downloads: offlineTotal, stars: fallback.stars, version: fallback.version, releasedAt: fallback.releasedAt, highlights: fallback.highlights })
  })

  it('nimmt die Rückfallwerte bei einem Rate-Limit (403)', async () => {
    const limited = { status: 403, body: { message: 'API rate limit exceeded' } }
    const stats = await getStats(fakeFetch({ '/releases': limited, '/repos/speedone/mietfuchs': limited, '/versions': limited }))
    expect(stats.downloads).toBe(offlineTotal)
    expect(stats.version).toBe(fallback.version)
  })

  it('nimmt für Docker den Rückfall, wenn die Versionsliste fehlt, und für GitHub die echte Zahl', async () => {
    const stats = await getStats(fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': repo, '/versions': { status: 500, body: '' } }))
    expect(stats.downloads).toBe(510 + fallback.dockerDownloads)
  })

  it('mischt bei einer Teilantwort: Downloads von GitHub, Stars aus dem Rückfall', async () => {
    const stats = await getStats(fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': { status: 500, body: {} }, 'page=1': docker, 'page=2': dockerEmpty }))
    expect(stats.downloads).toBe(510 + 1037)
    expect(stats.stars).toBe(fallback.stars)
  })

  it('zeigt nie weniger Downloads als der Rückfall, wenn die Antwort leer ist', async () => {
    const stats = await getStats(fakeFetch({ '/releases': { status: 200, body: [] }, '/repos/speedone/mietfuchs': repo, 'page=1': dockerEmpty }))
    expect(stats.downloads).toBe(offlineTotal)
    expect(stats.version).toBe(fallback.version)
  })
})

describe('isProgramFile', () => {
  it('zählt Installer, Programme und Pakete, auch die Programme ohne Endung', () => {
    for (const n of ['Mietfuchs-Setup-0.15.0.exe', 'mietfuchs-win-arm64.exe', 'Mietfuchs-0.15.0-arm64.dmg', 'mietfuchs-macos-intel.zip', 'mietfuchs-linux.tar.gz',
      'mietfuchs_0.14.1_amd64.deb', 'mietfuchs-0.14.1-1.x86_64.rpm', 'mietfuchs-0.14.1-1-aarch64.pkg.tar.zst', 'mietfuchs-linux', 'mietfuchs-macos-apple-silicon']) {
      expect(isProgramFile(n), n).toBe(true)
    }
  })
  it('zählt keine Dateien für Updates und kein Store-Paket', () => {
    for (const n of ['latest.yml', 'latest-mac.yml', 'Mietfuchs-Setup-0.15.0.exe.blockmap', 'Mietfuchs-0.15.0.msixbundle', 'SHA256SUMS.txt', 'checksums.sha256']) {
      expect(isProgramFile(n), n).toBe(false)
    }
  })
  it('lässt solche Dateien in der Summe weg', async () => {
    const withUpdates = { status: 200, body: [{ tag_name: 'v0.15.0', published_at: '2026-11-03T06:00:00Z', draft: false, prerelease: false,
      assets: [{ name: 'Mietfuchs-Setup-0.15.0.exe', download_count: 40 }, { name: 'latest.yml', download_count: 9000 }, { name: 'Mietfuchs-Setup-0.15.0.exe.blockmap', download_count: 300 }] }] }
    const stats = await getStats(fakeFetch({ '/releases': withUpdates, '/repos/speedone/mietfuchs': repo, 'page=1': docker, 'page=2': dockerEmpty }))
    expect(stats.downloads).toBe(40 + 1037)
  })
})

describe('dockerReleaseDownloads', () => {
  it('zählt nur Versionen mit vollständiger Versionsnummer: ohne main, ohne Vorabversionen', () => {
    expect(dockerReleaseDownloads(String(docker.body))).toEqual({ rows: 5, sum: 17 + 8 + 1012 })
  })
  it('meldet eine leere Seite und erkennt eine unlesbare Zahl', () => {
    expect(dockerReleaseDownloads(String(dockerEmpty.body))).toEqual({ rows: 0, sum: 0 })
    expect(dockerReleaseDownloads(String(versionsPage([row(['0.14.0'], '1.2k')]).body))).toBeNull()
  })
})

describe('cachedStats', () => {
  it('fragt GitHub beim Bauen nur einmal, egal wie viele Seiten die Zahlen brauchen', async () => {
    let calls = 0
    const counting = (async (input: string | URL | Request) => { calls++; return fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': repo, 'page=1': docker, 'page=2': dockerEmpty })(input) }) as typeof fetch
    const { createStatsCache } = await import('../src/lib/stats.ts')
    const cached = createStatsCache(counting)
    const [a, b] = await Promise.all([cached(), cached()])
    await cached()
    expect(a).toEqual(b)
    expect(calls).toBe(4) // Repo, erste Seite der Releases, zwei Seiten der Docker-Versionen
  })
})

describe('formatCount', () => {
  it('schreibt Tausender mit Punkt', () => {
    expect(formatCount(1234)).toBe('1.234')
    expect(formatCount(510)).toBe('510')
  })
})
