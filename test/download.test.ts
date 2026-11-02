import { describe, expect, it } from 'vitest'
import { handleDownload, loadTargets, sourcePath, targetFor, type DownloadCounter } from '../functions/_lib/download.ts'
import { resolveTargets } from '../src/lib/download-targets.ts'
import { RELEASE_BASE, REPO_URL, STORE_URL } from '../src/lib/site.ts'

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

describe('targetFor', () => {
  it('führt Windows in den Store und die übrigen Plattformen zu GitHub', () => {
    expect(targetFor('windows')).toBe(STORE_URL)
    expect(targetFor('windows-exe')).toBe(`${RELEASE_BASE}mietfuchs-win.exe`)
    expect(targetFor('macos')).toBe(`${RELEASE_BASE}mietfuchs-macos-apple-silicon.zip`)
    expect(targetFor('linux-arm')).toBe(`${RELEASE_BASE}mietfuchs-linux-arm64.tar.gz`)
    expect(targetFor('irgendwas')).toBeNull()
    expect(targetFor('constructor')).toBeNull()
  })
})

describe('resolveTargets', () => {
  const pinned = `${REPO_URL}/releases/download/v0.14.1/`
  it('verlinkt die Dateien des neuesten Release mit fester Version', () => {
    const t = resolveTargets({ tag: 'v0.14.1', assets: ['mietfuchs-win.exe', 'mietfuchs-macos-apple-silicon.zip', 'mietfuchs-linux.tar.gz'] })
    expect(t['windows-exe']).toBe(`${pinned}mietfuchs-win.exe`)
    expect(t.macos).toBe(`${pinned}mietfuchs-macos-apple-silicon.zip`)
    expect(t.linux).toBe(`${pinned}mietfuchs-linux.tar.gz`)
  })
  it('nimmt „latest“, wenn eine Datei im Release fehlt oder das Release unbekannt ist', () => {
    expect(resolveTargets({ tag: 'v0.14.1', assets: [] })['linux-arm']).toBe(`${RELEASE_BASE}mietfuchs-linux-arm64.tar.gz`)
    expect(resolveTargets(null)['windows-exe']).toBe(`${RELEASE_BASE}mietfuchs-win.exe`)
  })
  it('kennt Windows nicht: das führt immer in den Store', () => {
    expect(Object.keys(resolveTargets(null)).sort()).toEqual(['linux', 'linux-arm', 'macos', 'macos-intel', 'windows-arm', 'windows-exe'])
  })
})

describe('targetFor mit den Zielen des Builds', () => {
  const pinned = `${REPO_URL}/releases/download/v0.14.1/mietfuchs-win.exe`
  it('nimmt das Ziel aus dem Build, Windows bleibt beim Store', () => {
    expect(targetFor('windows-exe', { 'windows-exe': pinned })).toBe(pinned)
    expect(targetFor('windows', { windows: pinned })).toBe(STORE_URL)
  })
  it('ignoriert Ziele außerhalb der Releases von Mietfuchs', () => {
    expect(targetFor('windows-exe', { 'windows-exe': 'https://example.org/x.exe' })).toBe(`${RELEASE_BASE}mietfuchs-win.exe`)
    expect(targetFor('windows-exe', { 'windows-exe': `${REPO_URL}/releases/../evil` })).toBe(`${RELEASE_BASE}mietfuchs-win.exe`)
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
