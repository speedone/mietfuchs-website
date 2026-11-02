import { describe, expect, it } from 'vitest'
import fallback from '../src/data/stats-fallback.json' with { type: 'json' }
import { LINUX_ARCHIVE_CORRECTION, dockerReleaseDownloads, estimateRealDownloads, formatCount, getStats, githubDownloads, isProgramFile, type Release } from '../src/lib/stats.ts'

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
    expect(stats).toEqual({ downloads: 509 + 17 + 8 + 1012 + fallback.storeDownloads, stars: 12, version: '0.14.0', releasedAt: '2026-11-01', highlights: [],
      release: { tag: 'v0.14.0', assets: ['mietfuchs-win.exe'] } })
  })

  const offlineTotal = fallback.downloads + fallback.dockerDownloads + fallback.storeDownloads
  it('nimmt die Rückfallwerte, wenn GitHub nicht erreichbar ist', async () => {
    const stats = await getStats(fakeFetch({ '/releases': new Error('offline'), '/repos/speedone/mietfuchs': new Error('offline'), '/versions': new Error('offline') }))
    expect(stats).toEqual({ downloads: offlineTotal, stars: fallback.stars, version: fallback.version, releasedAt: fallback.releasedAt, highlights: fallback.highlights, release: null })
  })

  it('nimmt die Rückfallwerte bei einem Rate-Limit (403)', async () => {
    const limited = { status: 403, body: { message: 'API rate limit exceeded' } }
    const stats = await getStats(fakeFetch({ '/releases': limited, '/repos/speedone/mietfuchs': limited, '/versions': limited }))
    expect(stats.downloads).toBe(offlineTotal)
    expect(stats.version).toBe(fallback.version)
  })

  it('nimmt für Docker den Rückfall, wenn die Versionsliste fehlt, und für GitHub die echte Zahl', async () => {
    const stats = await getStats(fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': repo, '/versions': { status: 500, body: '' } }))
    expect(stats.downloads).toBe(509 + fallback.dockerDownloads + fallback.storeDownloads)
  })

  it('mischt bei einer Teilantwort: Downloads von GitHub, Stars aus dem Rückfall', async () => {
    const stats = await getStats(fakeFetch({ '/releases': releases, '/repos/speedone/mietfuchs': { status: 500, body: {} }, 'page=1': docker, 'page=2': dockerEmpty }))
    expect(stats.downloads).toBe(509 + 1037 + fallback.storeDownloads)
    expect(stats.stars).toBe(fallback.stars)
  })

  it('zeigt nie weniger Downloads als der Rückfall, wenn die Antwort leer ist', async () => {
    const stats = await getStats(fakeFetch({ '/releases': { status: 200, body: [] }, '/repos/speedone/mietfuchs': repo, 'page=1': dockerEmpty }))
    expect(stats.downloads).toBe(offlineTotal)
    expect(stats.version).toBe(fallback.version)
  })
})

describe('Store-Erwerbe', () => {
  const env = { MSSTORE_TENANT_ID: 't', MSSTORE_CLIENT_ID: 'c', MSSTORE_CLIENT_SECRET: 's' }
  const token = { status: 200, body: { access_token: 'abc' } }
  const acquisitions = { status: 200, body: { Value: [{ date: '2026-10-01', acquisitionQuantity: 1 }, { date: '2026-11-01', acquisitionQuantity: 2 }], TotalCount: 2 } }
  const routes = { '/releases': releases, '/repos/speedone/mietfuchs': repo, 'page=1': docker, 'page=2': dockerEmpty, 'login.microsoftonline.com': token }

  it('zählt die Erwerbe aus dem Microsoft Store dazu', async () => {
    const stats = await getStats(fakeFetch({ ...routes, '/analytics/appacquisitions': acquisitions }), env)
    expect(stats.downloads).toBe(509 + 1037 + 3)
  })
  it('fällt nie unter den letzten bekannten Stand, wenn der Store frische Tage neu berechnet', async () => {
    const revised = { status: 200, body: { Value: [{ date: '2026-10-31', acquisitionQuantity: 1 }], TotalCount: 1 } }
    const stats = await getStats(fakeFetch({ ...routes, '/analytics/appacquisitions': revised }), env)
    expect(stats.downloads).toBe(509 + 1037 + Math.max(1, fallback.storeDownloads))
  })
  it('nimmt den Rückfall ohne Zugangsdaten, ohne Schlüssel oder bei unvollständiger Antwort', async () => {
    const base = 509 + 1037 + fallback.storeDownloads
    expect((await getStats(fakeFetch({ ...routes, '/analytics/appacquisitions': acquisitions }), {})).downloads).toBe(base)
    expect((await getStats(fakeFetch({ ...routes, 'login.microsoftonline.com': { status: 401, body: {} }, '/analytics/appacquisitions': acquisitions }), env)).downloads).toBe(base)
    const partial = { status: 200, body: { Value: [{ acquisitionQuantity: 1 }], TotalCount: 5 } }
    expect((await getStats(fakeFetch({ ...routes, '/analytics/appacquisitions': partial }), env)).downloads).toBe(base)
    expect((await getStats(fakeFetch({ ...routes, '/analytics/appacquisitions': new Error('offline') }), env)).downloads).toBe(base)
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
    expect(stats.downloads).toBe(39 + 1037 + fallback.storeDownloads)
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
    const cached = createStatsCache(counting, {}) // ohne Store-Zugang, auch wenn CI ihn gesetzt hat
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

const rel = (tag: string, assets: [string, number][], extra: Partial<Release> = {}): Release =>
  ({ tag_name: tag, published_at: '2026-11-01T00:00:00Z', draft: false, prerelease: false, assets: assets.map(([name, download_count]) => ({ name, download_count })), ...extra })

describe('githubDownloads: Bot beim Release', () => {
  it('zieht ab v0.14.0 je Programmdatei den einen Download des Bots ab, nie unter 0', () => {
    expect(githubDownloads([
      rel('v0.15.1', [['Mietfuchs-Setup-0.15.1.exe', 1], ['mietfuchs-linux.tar.gz', 0], ['SHA256SUMS.txt', 1], ['Mietfuchs-Setup-0.15.1.exe.blockmap', 1]]),
      rel('v0.14.0', [['mietfuchs-win.exe', 3], ['mietfuchs-macos-intel.zip', 2]]),
      rel('v0.16.0-rc.1', [['Mietfuchs-Setup-0.16.0-rc.1.exe', 4]], { prerelease: true }),
    ])).toBe(0 + 0 + 2 + 1 + 3)
  })
  it('lässt Releases vor v0.14.0 unverändert', () => {
    expect(githubDownloads([rel('v0.13.1', [['mietfuchs-win.exe', 4]]), rel('v0.9.0-rc.5', [['mietfuchs-win.exe', 2]], { prerelease: true })])).toBe(6)
  })
})

// Stand vom 02.11.2026 (gh api repos/speedone/mietfuchs/releases), die fünf betroffenen Releases
const SNAPSHOT: Release[] = [
  rel('v0.3.1', [['mietfuchs-linux.tar.gz', 31], ['mietfuchs-macos-apple-silicon.zip', 1], ['mietfuchs-macos-intel.zip', 1], ['mietfuchs-win.exe', 1]]),
  rel('v0.7.1', [['mietfuchs-0.7.1-1-aarch64.pkg.tar.zst', 1], ['mietfuchs-0.7.1-1-x86_64.pkg.tar.zst', 1], ['mietfuchs-0.7.1-1.aarch64.rpm', 1], ['mietfuchs-0.7.1-1.x86_64.rpm', 1],
    ['mietfuchs-linux-arm64.tar.gz', 2], ['mietfuchs-linux.tar.gz', 26], ['mietfuchs-macos-apple-silicon.zip', 4], ['mietfuchs-macos-intel.zip', 3], ['mietfuchs-win-arm64.exe', 2],
    ['mietfuchs-win.exe', 3], ['mietfuchs_0.7.1_amd64.deb', 2], ['mietfuchs_0.7.1_arm64.deb', 1]]),
  rel('v0.9.0', [['mietfuchs-0.9.0-1-aarch64.pkg.tar.zst', 1], ['mietfuchs-0.9.0-1-x86_64.pkg.tar.zst', 1], ['mietfuchs-0.9.0-1.aarch64.rpm', 1], ['mietfuchs-0.9.0-1.x86_64.rpm', 2],
    ['mietfuchs-linux-arm64.tar.gz', 1], ['mietfuchs-linux.tar.gz', 33], ['mietfuchs-macos-apple-silicon.zip', 5], ['mietfuchs-macos-intel.zip', 1], ['mietfuchs-win-arm64.exe', 1],
    ['mietfuchs-win.exe', 4], ['mietfuchs_0.9.0_amd64.deb', 2], ['mietfuchs_0.9.0_arm64.deb', 1]]),
  rel('v0.12.0', [['mietfuchs-0.12.0-1-aarch64.pkg.tar.zst', 1], ['mietfuchs-0.12.0-1-x86_64.pkg.tar.zst', 1], ['mietfuchs-0.12.0-1.aarch64.rpm', 1], ['mietfuchs-0.12.0-1.x86_64.rpm', 1],
    ['mietfuchs-linux-arm64.tar.gz', 1], ['mietfuchs-linux.tar.gz', 30], ['mietfuchs-macos-apple-silicon.zip', 2], ['mietfuchs-macos-intel.zip', 1], ['mietfuchs-win-arm64.exe', 1],
    ['mietfuchs-win.exe', 8], ['mietfuchs_0.12.0_amd64.deb', 1], ['mietfuchs_0.12.0_arm64.deb', 1]]),
  rel('v0.14.1', [['mietfuchs-0.14.1-1-aarch64.pkg.tar.zst', 1], ['mietfuchs-0.14.1-1-x86_64.pkg.tar.zst', 1], ['mietfuchs-0.14.1-1.aarch64.rpm', 1], ['mietfuchs-0.14.1-1.x86_64.rpm', 1],
    ['mietfuchs-linux-arm64.tar.gz', 2], ['mietfuchs-linux.tar.gz', 30], ['mietfuchs-macos-apple-silicon.zip', 6], ['mietfuchs-macos-intel.zip', 2], ['mietfuchs-win-arm64.exe', 2],
    ['mietfuchs-win.exe', 2], ['mietfuchs_0.14.1_amd64.deb', 1], ['mietfuchs_0.14.1_arm64.deb', 1]]),
]

describe('githubDownloads: Praxistests an den Linux-Archiven', () => {
  it('schätzt echte Downloads als Median der übrigen x64-Programmdateien, mindestens 1', () => {
    expect(SNAPSHOT.map((r) => estimateRealDownloads(r, 'mietfuchs-linux.tar.gz'))).toEqual([1, 2, 2, 1, 1])
    expect(estimateRealDownloads(rel('v0.1.0', [['mietfuchs-linux.tar.gz', 9]]), 'mietfuchs-linux.tar.gz')).toBe(1)
  })
  it('hält die Korrektur aus dem Stand vom 02.11.2026 fest: heutiger Stand minus Schätzwert', () => {
    expect(LINUX_ARCHIVE_CORRECTION).toEqual(SNAPSHOT.map((r) => {
      const count = r.assets.find((a) => a.name === 'mietfuchs-linux.tar.gz')?.download_count ?? 0
      const estimate = estimateRealDownloads(r, 'mietfuchs-linux.tar.gz')
      return { tag: r.tag_name, file: 'mietfuchs-linux.tar.gz', subtract: count - estimate, estimate }
    }))
  })
  it('zieht den Abzug ab, nie unter den Schätzwert, und lässt spätere echte Downloads stehen', () => {
    const only = (tag: string, n: number): Release[] => [rel(tag, [['mietfuchs-linux.tar.gz', n]])]
    expect(githubDownloads(only('v0.3.1', 31))).toBe(1)
    expect(githubDownloads(only('v0.9.0', 40))).toBe(40 - 31)
    expect(githubDownloads(only('v0.9.0', 10))).toBe(2)
    expect(githubDownloads(only('v0.10.0', 33))).toBe(33) // andere Releases unverändert
  })
  it('ergibt mit dem Bot-Abzug für den Stand vom 02.11.2026 je Release die erwartete Summe', () => {
    // v0.14.1: Archiv auf den Schätzwert 1, dann wie jede Datei ab v0.14.0 minus 1 für den Bot
    expect(SNAPSHOT.map((r) => githubDownloads([r]))).toEqual([34 - 30, 47 - 24, 53 - 31, 49 - 29, 50 - 29 - 12])
  })
})
