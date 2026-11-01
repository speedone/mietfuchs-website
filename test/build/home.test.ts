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
    const micro = doc.querySelector('[data-section=hero] .micro')?.text ?? ''
    expect(micro).toContain('ohne Konto')
    expect(micro).toContain('ohne Abo')
    for (const a of ['/herunterladen#macos', '/herunterladen#linux', '/herunterladen#docker']) {
      expect(doc.querySelector(`[data-section=hero] a[href="${a}"]`), a).not.toBeNull()
    }
  })
  it('hat den Abschnitt „Was Mietfuchs vor dem Versand prüft“', () => {
    expect(doc.querySelector('#pruefung h2')?.text).toBe('Was Mietfuchs vor dem Versand prüft')
  })
  it('liefert SoftwareApplication und FAQPage als strukturierte Daten', () => {
    const types = ld.map((d) => d['@type'])
    expect(types).toContain('SoftwareApplication')
    expect(types).toContain('FAQPage')
  })
  it('zeigt die echte Download-Zahl (ohne Netz: Rückfallwert)', () => {
    expect(doc.querySelector('[data-stat=downloads]')?.text).toContain(formatCount(fallback.downloads))
  })
  it('zeigt im Kopf einen eigenen GitHub-Knopf mit Sternen, ohne fremde Skripte', () => {
    const gh = doc.querySelector('header a[data-github-stars]')
    expect(gh?.getAttribute('href')).toBe('https://github.com/speedone/mietfuchs')
    expect(gh?.querySelector('svg')).not.toBeNull()
    expect(gh?.querySelector('[data-stars]')?.text.trim()).toBe(formatCount(fallback.stars))
    // Kein aria-label, das vom sichtbaren Text abweicht (WCAG 2.5.3, axe label-content-name-mismatch)
    expect(gh?.getAttribute('aria-label')).toBeUndefined()
    expect(gh?.text.replace(/\s+/g, ' ')).toContain(`${formatCount(fallback.stars)} Sterne`)
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
  it('zeigt Bildschirmfotos mit Alternativtext und festen Maßen', () => {
    const imgs = doc.querySelectorAll('[data-section=screens] img')
    expect(imgs.length).toBeGreaterThanOrEqual(3)
    for (const img of imgs) {
      expect(img.getAttribute('alt')).toBeTruthy()
      expect(img.getAttribute('width')).toBeTruthy()
      expect(img.getAttribute('height')).toBeTruthy()
    }
  })
})
