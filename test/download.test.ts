import { describe, expect, it } from 'vitest'
import { handleDownload, liveTargets, loadTargets, sourcePath, targetFor, type DownloadCounter } from '../functions/_lib/download.ts'
import { resolveTargets, targetFile } from '../src/lib/download-targets.ts'
import { APP_VERSION, RELEASE_BASE, REPO_URL, STORE_URL, downloadFile, fallbackUrl } from '../src/lib/site.ts'

const NOW = new Date('2026-11-01T22:30:00Z')
function counter(fail = false): DownloadCounter & { calls: [string, string, string][] } {
  const calls: [string, string, string][] = []
  return {
    calls,
    async add(day, platform, source) {
      if (fail) throw new Error('D1 nicht erreichbar')
      calls.push([day, platform, source])
    },
  }
}
const req = (path: string, referer?: string): Request =>
  new Request(`https://mietfuchs-app.de${path}`, { headers: referer ? { Referer: referer } : {} })

const V = APP_VERSION
const fixed = `${REPO_URL}/releases/download/v${V}/`

describe('Download-Dateien', () => {
  it('setzt die Version in die Namen von Installer und Mac-Abbildern ein', () => {
    expect(downloadFile('windows-exe')).toBe(`Mietfuchs-Setup-${V}.exe`)
    expect(downloadFile('macos', 'v0.16.2')).toBe('Mietfuchs-0.16.2-apple-silicon.dmg')
    expect(downloadFile('macos-intel', '0.15.0')).toBe('Mietfuchs-0.15.0-intel.dmg')
    expect(downloadFile('linux', 'v0.16.2')).toBe('mietfuchs-linux.tar.gz')
  })
  it('verweist ohne Wissen über das Release für Dateien mit Version fest auf APP_VERSION, sonst auf „latest“', () => {
    expect(fallbackUrl('windows-exe')).toBe(`${fixed}Mietfuchs-Setup-${V}.exe`)
    expect(fallbackUrl('macos-intel')).toBe(`${fixed}Mietfuchs-${V}-intel.dmg`)
    expect(fallbackUrl('linux-arm')).toBe(`${RELEASE_BASE}mietfuchs-linux-arm64.tar.gz`)
  })
})

describe('targetFor', () => {
  it('führt Windows in den Store und die übrigen Plattformen zu GitHub', () => {
    expect(targetFor('windows')).toBe(STORE_URL)
    expect(targetFor('windows-exe')).toBe(`${fixed}Mietfuchs-Setup-${V}.exe`)
    expect(targetFor('macos')).toBe(`${fixed}Mietfuchs-${V}-apple-silicon.dmg`)
    expect(targetFor('macos-intel')).toBe(`${fixed}Mietfuchs-${V}-intel.dmg`)
    expect(targetFor('linux')).toBe(`${RELEASE_BASE}mietfuchs-linux.tar.gz`)
    expect(targetFor('linux-arm')).toBe(`${RELEASE_BASE}mietfuchs-linux-arm64.tar.gz`)
    expect(targetFor('irgendwas')).toBeNull()
    expect(targetFor('constructor')).toBeNull()
  })
  it('kennt die einzelnen Programmdateien für Windows auf ARM nicht mehr: der Installer gilt für beide', () => {
    expect(targetFor('windows-arm')).toBeNull()
  })
})

describe('resolveTargets', () => {
  const pinned = (tag: string) => `${REPO_URL}/releases/download/${tag}/`
  it('verlinkt die Dateien des neuesten Release mit fester Version', () => {
    const t = resolveTargets({ tag: 'v0.15.0', assets: ['Mietfuchs-Setup-0.15.0.exe', 'Mietfuchs-0.15.0-apple-silicon.dmg', 'Mietfuchs-0.15.0-intel.dmg', 'mietfuchs-linux.tar.gz'] })
    expect(t['windows-exe']).toBe(`${pinned('v0.15.0')}Mietfuchs-Setup-0.15.0.exe`)
    expect(t.macos).toBe(`${pinned('v0.15.0')}Mietfuchs-0.15.0-apple-silicon.dmg`)
    expect(t['macos-intel']).toBe(`${pinned('v0.15.0')}Mietfuchs-0.15.0-intel.dmg`)
    expect(t.linux).toBe(`${pinned('v0.15.0')}mietfuchs-linux.tar.gz`)
  })
  it('folgt einem neueren Release, ohne dass APP_VERSION angepasst werden muss', () => {
    const t = resolveTargets({ tag: 'v0.16.0', assets: ['Mietfuchs-Setup-0.16.0.exe', 'Mietfuchs-0.16.0-intel.dmg'] })
    expect(t['windows-exe']).toBe(`${pinned('v0.16.0')}Mietfuchs-Setup-0.16.0.exe`)
    expect(t['macos-intel']).toBe(`${pinned('v0.16.0')}Mietfuchs-0.16.0-intel.dmg`)
    expect(t.macos).toBe(`${fixed}Mietfuchs-${V}-apple-silicon.dmg`)
  })
  it('nimmt das Ziel ohne Release-Wissen, wenn eine Datei fehlt oder das Release unbekannt ist', () => {
    expect(resolveTargets({ tag: 'v0.14.1', assets: ['mietfuchs-win.exe'] })['windows-exe']).toBe(`${fixed}Mietfuchs-Setup-${V}.exe`)
    expect(resolveTargets({ tag: 'v0.15.0', assets: [] })['linux-arm']).toBe(`${RELEASE_BASE}mietfuchs-linux-arm64.tar.gz`)
    expect(resolveTargets(null)['windows-exe']).toBe(`${fixed}Mietfuchs-Setup-${V}.exe`)
  })
  it('kennt Windows nicht: das führt immer in den Store', () => {
    expect(Object.keys(resolveTargets(null)).sort()).toEqual(['linux', 'linux-arm', 'macos', 'macos-intel', 'windows-exe'])
  })
  it('liefert den Dateinamen eines Ziels für den Linktext', () => {
    expect(targetFile(`${pinned('v0.15.0')}Mietfuchs-0.15.0-intel.dmg`)).toBe('Mietfuchs-0.15.0-intel.dmg')
  })
})

describe('targetFor mit den Zielen des Builds', () => {
  const pinned = `${REPO_URL}/releases/download/v0.15.0/Mietfuchs-Setup-0.15.0.exe`
  it('nimmt das Ziel aus dem Build, Windows bleibt beim Store', () => {
    expect(targetFor('windows-exe', { 'windows-exe': pinned })).toBe(pinned)
    expect(targetFor('windows', { windows: pinned })).toBe(STORE_URL)
  })
  it('ignoriert Ziele außerhalb der Releases von Mietfuchs', () => {
    expect(targetFor('windows-exe', { 'windows-exe': 'https://example.org/x.exe' })).toBe(`${fixed}Mietfuchs-Setup-${V}.exe`)
    expect(targetFor('windows-exe', { 'windows-exe': `${REPO_URL}/releases/../evil` })).toBe(`${fixed}Mietfuchs-Setup-${V}.exe`)
    expect(targetFor('irgendwas', { irgendwas: pinned })).toBeNull()
  })
})

describe('loadTargets', () => {
  const assets = (res: Response | Error) => ({ fetch: async () => { if (res instanceof Error) throw res; return res } })
  it('liest die Ziele aus der Datei des Builds', async () => {
    expect(await loadTargets(assets(new Response('{"linux":"x"}')), 'https://mietfuchs-app.de/download/linux')).toEqual({ linux: 'x' })
  })
  it('liefert ein leeres Ergebnis, wenn die Datei fehlt oder kaputt ist', async () => {
    expect(await loadTargets(assets(new Response('nicht da', { status: 404 })), 'https://mietfuchs-app.de/download/linux')).toEqual({})
    expect(await loadTargets(assets(new Response('{kaputt')), 'https://mietfuchs-app.de/download/linux')).toEqual({})
    expect(await loadTargets(assets(new Response('[1,2]')), 'https://mietfuchs-app.de/download/linux')).toEqual({})
    expect(await loadTargets(assets(new Error('weg')), 'https://mietfuchs-app.de/download/linux')).toEqual({})
    expect(await loadTargets(undefined, 'https://mietfuchs-app.de/download/linux')).toEqual({})
  })
})

describe('sourcePath', () => {
  it('nimmt von der eigenen Seite nur den Pfad, ohne Query und Anker', () => {
    expect(sourcePath('https://mietfuchs-app.de/nebenkostenabrechnung-vorlage?utm=x#a', 'mietfuchs-app.de')).toBe('/nebenkostenabrechnung-vorlage')
  })
  it('speichert fremde Herkunft nur als „extern“', () => {
    expect(sourcePath('https://example.org/foo?name=Max', 'mietfuchs-app.de')).toBe('extern')
    expect(sourcePath('kein url', 'mietfuchs-app.de')).toBe('extern')
  })
  it('kürzt überlange Pfade, damit gefälschte Referer die Tabelle nicht aufblähen', () => {
    expect(sourcePath(`https://mietfuchs-app.de/${'x'.repeat(500)}`, 'mietfuchs-app.de')).toHaveLength(120)
  })
  it('meldet fehlende Herkunft als „direkt“', () => {
    expect(sourcePath(null, 'mietfuchs-app.de')).toBe('direkt')
    expect(sourcePath('', 'mietfuchs-app.de')).toBe('direkt')
  })
})

describe('handleDownload', () => {
  it('leitet weiter und zählt Tag, Plattform und Herkunftsseite', async () => {
    const c = counter()
    const res = await handleDownload(req('/download/windows', 'https://mietfuchs-app.de/nebenkostenabrechnung-vorlage?utm=x#a'), 'windows', c, NOW)
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(STORE_URL)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
    expect(c.calls).toEqual([['2026-11-01', 'windows', '/nebenkostenabrechnung-vorlage']])
  })
  it('schickt Unbekanntes zur Seite „Herunterladen“, ohne zu zählen', async () => {
    const c = counter()
    const res = await handleDownload(req('/download/irgendwas'), 'irgendwas', c, NOW)
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe('https://mietfuchs-app.de/herunterladen')
    expect(c.calls).toEqual([])
  })
  it('leitet auch weiter, wenn der Zähler ausfällt', async () => {
    const res = await handleDownload(req('/download/linux'), 'linux', counter(true), NOW)
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(`${RELEASE_BASE}mietfuchs-linux.tar.gz`)
  })
})

describe('liveTargets: neuestes Release beim Aufruf', () => {
  const api = (tag: string, names: string[]) => new Response(JSON.stringify({ tag_name: tag, assets: names.map((name) => ({ name })) }), { status: 200 })
  const memoryCache = () => {
    const store = new Map<string, Response>()
    return { store, match: async (r: Request) => store.get(r.url)?.clone(), put: async (r: Request, res: Response) => { store.set(r.url, res.clone()) } }
  }
  it('führt nach einem neuen Release auf die Datei mit der neuen Version', async () => {
    const calls: string[] = []
    const fetchImpl = (async (input: string | URL | Request, init?: RequestInit) => {
      calls.push(String(input))
      expect(new Headers(init?.headers).get('User-Agent')).toBeTruthy()
      return api('v0.16.0', ['Mietfuchs-Setup-0.16.0.exe', 'Mietfuchs-0.16.0-intel.dmg'])
    }) as typeof fetch
    const live = await liveTargets(fetchImpl, undefined)
    expect(calls).toEqual(['https://api.github.com/repos/speedone/mietfuchs/releases/latest'])
    expect(live).toEqual({
      'windows-exe': `${REPO_URL}/releases/download/v0.16.0/Mietfuchs-Setup-0.16.0.exe`,
      'macos-intel': `${REPO_URL}/releases/download/v0.16.0/Mietfuchs-0.16.0-intel.dmg`,
    })
    const built = { 'windows-exe': `${REPO_URL}/releases/download/v0.15.1/Mietfuchs-Setup-0.15.1.exe`, macos: `${REPO_URL}/releases/download/v0.15.1/Mietfuchs-0.15.1-apple-silicon.dmg` }
    const merged = { ...built, ...live }
    expect(targetFor('windows-exe', merged)).toBe(`${REPO_URL}/releases/download/v0.16.0/Mietfuchs-Setup-0.16.0.exe`)
    expect(targetFor('macos', merged)).toBe(built.macos) // fehlt am Release: Ziel aus dem Bau
    expect(targetFor('windows', merged)).toBe(STORE_URL)
  })
  it('fragt GitHub höchstens alle fünf Minuten und nimmt sonst den Zwischenspeicher', async () => {
    let n = 0
    const fetchImpl = (async () => { n++; return api('v0.16.0', ['Mietfuchs-Setup-0.16.0.exe']) }) as typeof fetch
    const cache = memoryCache()
    await liveTargets(fetchImpl, cache)
    const second = await liveTargets(fetchImpl, cache)
    expect(n).toBe(1)
    expect(second['windows-exe']).toContain('v0.16.0')
    expect([...cache.store.values()][0]?.headers.get('Cache-Control')).toBe('max-age=300')
  })
  it('liefert nichts, wenn GitHub ausfällt, nicht antwortet oder Unsinn schickt', async () => {
    expect(await liveTargets((async () => { throw new Error('offline') }) as typeof fetch, undefined)).toEqual({})
    expect(await liveTargets((async () => new Response('{}', { status: 403 })) as typeof fetch, undefined)).toEqual({})
    expect(await liveTargets((async () => new Response('kaputt', { status: 200 })) as typeof fetch, undefined)).toEqual({})
    const hanging = ((_: unknown, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener('abort', () => reject(new Error('Zeitlimit')))
    })) as typeof fetch
    const started = Date.now()
    expect(await liveTargets(hanging, undefined, 50)).toEqual({})
    expect(Date.now() - started).toBeLessThan(1000)
  })
})

describe('handleDownload mit HEAD', () => {
  it('antwortet auf HEAD wie auf GET mit 302, zählt aber nicht', async () => {
    const c = counter()
    const res = await handleDownload(new Request('https://mietfuchs-app.de/download/linux', { method: 'HEAD' }), 'linux', c, NOW)
    expect(res.status).toBe(302)
    expect(res.headers.get('Location')).toBe(`${RELEASE_BASE}mietfuchs-linux.tar.gz`)
    expect(c.calls).toEqual([])
  })
  it('bietet die Pages-Function für HEAD an', async () => {
    const mod = await import('../functions/download/[platform].ts')
    expect(typeof mod.onRequestHead).toBe('function')
  })
})
