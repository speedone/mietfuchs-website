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
    expect(micro).toMatch(/ohne Konto/i)
    expect(micro).toContain('ohne Abo')
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
    const links = doc.querySelectorAll('[data-section=screens] a[data-zoom]')
    expect(links.length).toBeGreaterThanOrEqual(3)
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^\/_astro\/.+\.(webp|png|avif)$/)
      expect(a.querySelector('img')).not.toBeNull()
    }
    expect(doc.querySelector('dialog[data-zoom-dialog]')).not.toBeNull()
  })
  it('zeigt die Bildschirmfotos als Karussell mit Pause-Knopf und Ansichtswahl', () => {
    const c = doc.querySelector('[data-section=screens]')
    expect(c?.getAttribute('aria-roledescription')).toBe('Karussell')
    expect(c?.querySelector('[data-pause]')).not.toBeNull()
    expect(c?.querySelectorAll('[data-dot]').length).toBe(c?.querySelectorAll('.slide').length)
  })
  it('zeigt Bildschirmfotos mit Alternativtext und festen Maßen', () => {
    const imgs = doc.querySelectorAll('[data-section=screens] .slide img')
    expect(imgs.length).toBeGreaterThanOrEqual(3)
    for (const img of imgs) {
      expect(img.getAttribute('alt')).toBeTruthy()
      expect(img.getAttribute('width')).toBeTruthy()
      expect(img.getAttribute('height')).toBeTruthy()
    }
  })
})
