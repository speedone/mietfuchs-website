import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { readDist } from '../helpers/dist.ts'

const GUIDES: Record<string, string> = {
  'nebenkostenabrechnung-erstellen': 'nebenkostenabrechnung erstellen',
  'nebenkostenabrechnung-vorlage': 'nebenkostenabrechnung vorlage',
  'nebenkostenabrechnung-excel': 'nebenkostenabrechnung',
  'nebenkostenabrechnung-frist': 'frist',
  'umlagefaehige-nebenkosten': 'umlagefähige nebenkosten',
  heizkostenabrechnung: 'heizkostenabrechnung',
  'nebenkostenabrechnung-steuer': 'steuererklärung',
}

describe('Ratgeberseiten', () => {
  it.each(Object.entries(GUIDES))('%s: Suchbegriff im Titel, belegt, ohne Wettbewerber', (slug, keyword) => {
    const doc = readDist(`/${slug}`)
    expect(doc.querySelector('title')?.text.toLowerCase()).toContain(keyword)
    expect(doc.querySelector('h1')?.text.toLowerCase()).toContain(keyword.split(' ')[0])
    expect(doc.querySelector('#quellen')?.text).toMatch(/BGB|BetrKV|HeizkostenV|CO2KostAufG|EStG/)
    expect(doc.querySelector('main')?.text ?? '').not.toMatch(/__andere_anbieter__/i)
  })

  it('verlinkt auf der Vorlage-Seite das Muster als echtes, kleines PDF', () => {
    expect(readDist('/nebenkostenabrechnung-vorlage').querySelector('a[href="/downloads/beispiel-nebenkostenabrechnung.pdf"]')).not.toBeNull()
    const pdf = fs.readFileSync('public/downloads/beispiel-nebenkostenabrechnung.pdf')
    expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    expect(pdf.length).toBeLessThan(1024 * 1024)
  })

  it('hat auf der Frist-Seite den Fristenrechner und auf der Heizkosten-Seite Rechner und Stufentabelle', () => {
    expect(readDist('/nebenkostenabrechnung-frist').querySelector('[data-deadline-calc]')).not.toBeNull()
    const heating = readDist('/heizkostenabrechnung')
    expect(heating.querySelector('[data-heating-calc]')).not.toBeNull()
    expect(heating.querySelector('main')?.text).toContain('ab 52')
    expect(heating.querySelector('#quellen')?.text).toContain('CO2KostAufG')
  })

  it('verlinkt jede Ratgeberseite in der Übersicht', () => {
    const list = readDist('/ratgeber')
    for (const slug of Object.keys(GUIDES)) expect(list.querySelector(`a[href="/${slug}"]`), slug).not.toBeNull()
  })
})
