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
