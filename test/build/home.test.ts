import { describe, expect, it } from 'vitest'
import fallback from '../../src/data/stats-fallback.json' with { type: 'json' }
import { formatCount } from '../../src/lib/stats.ts'
import { readDist } from '../helpers/dist.ts'

const doc = readDist('/')
const ld = doc.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.text))

describe('Startseite', () => {
  it('nennt die Nebenkostenabrechnung in der Überschrift', () => {
    expect(doc.querySelector('h1')?.text).toMatch(/Nebenkostenabrechnung/)
  })
  it('hat oben genau einen Hauptknopf, der ohne JavaScript zu „Herunterladen“ führt', () => {
    const hero = doc.querySelector('[data-section=hero]')
    const primary = hero?.querySelectorAll('[data-cta=primary]') ?? []
    expect(primary).toHaveLength(1)
    expect(primary[0]?.getAttribute('href')).toBe('/herunterladen')
  })
  it('nimmt unter dem Knopf die Haken-Frage vorweg und verlinkt die anderen Systeme', () => {
    const micro = (doc.querySelector('[data-section=hero]')?.querySelectorAll('.micro') ?? []).map((m) => m.text).join(' ')
    expect(micro).toContain('Für')
    expect(doc.querySelector('[data-section=hero] .facts')?.text).toContain('Kostenlos, ohne Konto und Abo')
    for (const [a, name] of [['/herunterladen#windows', 'Windows'], ['/herunterladen#macos', 'macOS'], ['/herunterladen#linux', 'Linux'], ['/herunterladen#docker', 'Docker']]) {
      const link = doc.querySelector(`[data-section=hero] .systems a[href="${a}"]`)
      expect(link?.text.trim(), a).toBe(name)
      expect(link?.querySelector('svg.brand-icon')?.getAttribute('aria-hidden'), a).toBe('true')
    }
  })
  it('zeigt im Abschnitt für Technikaffine das Docker-Logo am Link zur Anleitung', () => {
    expect(doc.querySelector('.selfhost a[href="/herunterladen#docker"] svg.brand-icon')).not.toBeNull()
  })
  it('stellt in den Kacheln die Stärken vor, die andere Abschnitte nicht schon zeigen', () => {
    const titles = (doc.querySelector('section[aria-labelledby=funktionen-titel]')?.querySelectorAll('.cards h3') ?? []).map((h) => h.text.trim())
    expect(titles).toEqual(['Heizkosten selbst abrechnen', 'Fertiger Brief für jeden Mieter', 'Belege ablegen statt abtippen',
      'Die Steuer gleich mit', 'So, wie Sie vermieten', 'Nichts geht verloren'])
  })
  it('zeigt die Anwendungsfälle schon im Kopfbereich, jeder mit einem Link, der ankommt', () => {
    const links = doc.querySelectorAll('[data-section=hero] [data-use-cases] a')
    expect(links.length).toBeGreaterThanOrEqual(5)
    for (const a of links) {
      const [page = '', id] = (a.getAttribute('href') ?? '').split('#')
      const target = readDist(page)
      if (id) expect(target.getElementById(id), a.getAttribute('href') ?? '').not.toBeNull()
    }
    const text = links.map((a) => a.text).join(' ')
    for (const s of ['Einliegerwohnung', 'Mehrfamilienhaus', 'Eigentumswohnung', 'Mieterwechsel', 'Heiz']) expect(text, s).toContain(s)
  })
  it('sagt früh, für wen Mietfuchs passt: vor Prüfung und Funktionen', () => {
    const html = doc.querySelector('main')?.innerHTML ?? ''
    expect(html.indexOf('id="fuer-wen"')).toBeGreaterThan(0)
    expect(html.indexOf('id="fuer-wen"')).toBeLessThan(html.indexOf('id="pruefung"'))
    expect(html.indexOf('id="fuer-wen"')).toBeLessThan(html.indexOf('funktionen-titel'))
  })
  it('hat den Abschnitt „Was Mietfuchs vor dem Versand prüft“', () => {
    expect(doc.querySelector('#pruefung h2')?.text).toBe('Was Mietfuchs vor dem Versand prüft')
  })
  it('liefert SoftwareApplication und FAQPage als strukturierte Daten', () => {
    const types = ld.map((d) => d['@type'])
    expect(types).toContain('SoftwareApplication')
    expect(types).toContain('FAQPage')
  })
  it('zeigt die echte Download-Zahl (ohne Netz: Rückfallwerte von GitHub, Docker und Store)', () => {
    expect(doc.querySelector('[data-stat=downloads]')?.text).toContain(formatCount(fallback.downloads + fallback.dockerDownloads + fallback.storeDownloads))
  })
  it('zeigt im Kopf ein GitHub-Abzeichen mit Sternen und den Stern-Knopf mit Bitte im Abschnitt für Technikaffine', () => {
    const head = doc.querySelector('header a[href="https://github.com/speedone/mietfuchs"]')
    expect(head?.querySelector('svg')).not.toBeNull()
    expect(head?.text).toContain('GitHub')
    expect(head?.querySelector('[data-stars]')?.text.trim()).toBe(formatCount(fallback.stars))
    const star = doc.querySelector('.selfhost a[data-github-stars]')
    expect(star?.querySelector('[data-stars]')?.text.trim()).toBe(formatCount(fallback.stars))
    expect(star?.getAttribute('aria-label')).toBeUndefined()
    expect(doc.querySelector('.selfhost')?.text).toMatch(/Stern/)
  })
  it('kennzeichnet das Abrechnungsblatt als Beispiel', () => {
    expect(doc.querySelector('#rechenweg figcaption')?.text).toMatch(/Beispiel/)
  })
  it('nennt für Docker die Voraussetzung und den Sicherheitshinweis', () => {
    const t = doc.querySelector('.selfhost')?.text ?? ''
    expect(t).toMatch(/Docker installiert/)
    expect(t).toMatch(/nicht aus dem Internet/)
  })
  it('nennt im Abschnitt für Technikaffine einen Befehl, der ohne Repo funktioniert', () => {
    const code = doc.querySelector('.selfhost pre')?.text ?? ''
    expect(code).toContain('ghcr.io/speedone/mietfuchs')
    expect(code).not.toMatch(/docker compose up/)
  })
  it('erklärt den Rechenweg in vier Schritten mit stimmigen Zahlen', () => {
    const steps = doc.querySelectorAll('#rechenweg ol > li')
    expect(steps).toHaveLength(4)
    const text = doc.querySelector('#rechenweg')?.text ?? ''
    for (const s of ['1.344,00 €', '52', '256 m³', '273,00 €', '95,00 €']) expect(text, s).toContain(s)
  })
  it('sagt ehrlich, für wen Mietfuchs passt und für wen nicht', () => {
    expect(doc.querySelectorAll('#fuer-wen .fits li').length).toBeGreaterThanOrEqual(4)
    expect(doc.querySelectorAll('#fuer-wen .fits-not li').length).toBeGreaterThanOrEqual(2)
    expect(doc.querySelector('#fuer-wen')?.text).toMatch(/Dritte/)
  })
  it('vergleicht mit einer Excel-Vorlage und verlinkt den Ratgeber', () => {
    expect(doc.querySelectorAll('#excel table tbody tr').length).toBeGreaterThanOrEqual(5)
    expect(doc.querySelector('#excel a[href="/nebenkostenabrechnung-excel"]')).not.toBeNull()
  })
  it('hat einen Umschalter für hell und dunkel, dessen Skript als Datei geladen wird', () => {
    expect(doc.querySelector('header button[data-theme-toggle]')).not.toBeNull()
    expect(doc.querySelector('head script[src="/theme.js"]')).not.toBeNull()
  })
  it('lässt jedes Bildschirmfoto groß öffnen, auch ohne JavaScript', () => {
    const links = doc.querySelectorAll('[data-section=screens] a[data-zoom], [data-section=tour] a[data-zoom]')
    expect(links.length).toBe(7)
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^\/_astro\/.+\.(webp|png|avif)$/)
      expect(a.querySelector('img')).not.toBeNull()
    }
    expect(doc.querySelectorAll('dialog[data-zoom-dialog]')).toHaveLength(1)
  })
  it('zeigt im Kopf das Programmfenster und davor das gedruckte Blatt, als Beispiel gekennzeichnet', () => {
    const c = doc.querySelector('[data-section=hero] [data-section=screens]')
    expect(c?.querySelector('.window img')).not.toBeNull()
    expect(c?.querySelector('a.paper img')?.getAttribute('alt')).toMatch(/Gedruckte Nebenkostenabrechnung/)
    expect(c?.text).toMatch(/erfundenen Daten/)
  })
  it('führt in fünf Stationen vom Beleg bis zur Steuer, vor dem Rechenweg', () => {
    const titles = doc.querySelectorAll('#rundgang ol > li h3').map((h) => h.text.trim())
    expect(titles).toEqual(['Belege ablegen', 'Kosten verteilen', 'Abrechnung prüfen', 'Mieteingänge im Blick', 'Anlage V vorbereiten'])
    const html = doc.querySelector('main')?.innerHTML ?? ''
    expect(html.indexOf('id="rundgang"')).toBeLessThan(html.indexOf('id="rechenweg"'))
  })
  it('hat jedes Bild aus dem Programm in heller und dunkler Fassung, mit Alternativtext und festen Maßen', () => {
    const shots = doc.querySelectorAll('a.shot[data-zoom]')
    expect(shots).toHaveLength(6)
    for (const a of shots) {
      expect(a.getAttribute('data-zoom-dark')).toMatch(/^\/_astro\/.+\.webp$/)
      for (const cls of ['only-light', 'only-dark']) {
        const img = a.querySelector(`img.${cls}`)
        expect(img?.getAttribute('alt'), cls).toBeTruthy()
        expect(img?.getAttribute('width'), cls).toBeTruthy()
        expect(img?.getAttribute('height'), cls).toBeTruthy()
      }
    }
  })
})
