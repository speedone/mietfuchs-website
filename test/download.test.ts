import { describe, expect, it } from 'vitest'
import { handleDownload, sourcePath, targetFor, type DownloadCounter } from '../functions/_lib/download.ts'
import { RELEASE_BASE, STORE_URL } from '../src/lib/site.ts'

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
