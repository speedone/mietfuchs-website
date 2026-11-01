import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { TEST_ADDRESS as ADDRESS } from '../helpers/build.ts'
import { listDistPages, readDist, readDistText } from '../helpers/dist.ts'

const INDEXABLE = 'dist-indexable'

describe('Impressum und Datenschutz ohne Adresse (Vorschau)', () => {
  it('nennt den Namen und kündigt die Anschrift an', () => {
    const text = readDist('/impressum').querySelector('main')?.text ?? ''
    expect(text).toContain('Martin Geörger')
    expect(text).toContain('Anschrift folgt')
    expect(text).toContain('kontakt@mietfuchs-app.de')
    expect(text).not.toMatch(/Telefon/)
  })
  it('beschreibt in der Datenschutzerklärung, was wirklich passiert', () => {
    const text = readDist('/datenschutz').querySelector('main')?.text ?? ''
    for (const s of ['Cloudflare', 'Server-Logs', 'Download', 'keine IP', 'Kontaktformular', 'keine Cookies', 'Art. 6 Abs. 1 lit. f DSGVO', 'Beschwerde', 'Auskunft']) {
      expect(text, s).toContain(s)
    }
  })
})

describe('Bau mit Adresse und Schalter (freigegeben)', () => {
  it('zeigt die Adresse im Impressum, je Teil eine Zeile', () => {
    const text = readDist('/impressum', INDEXABLE).querySelector('main address')?.text ?? ''
    for (const part of ADDRESS.split(',')) expect(text).toContain(part.trim())
    expect(text).not.toContain('Anschrift folgt')
  })
  it('erlaubt Suchmaschinen alles und nennt die Sitemap', () => {
    const robots = readDistText('robots.txt', INDEXABLE)
    expect(robots).toContain('Allow: /')
    expect(robots).toContain('Sitemap: https://mietfuchs-app.de/sitemap-index.xml')
    expect(fs.existsSync(`${INDEXABLE}/sitemap-index.xml`)).toBe(true)
  })
  it('trägt auf keiner Seite noindex', () => {
    for (const page of listDistPages(INDEXABLE)) {
      expect(readDist(page, INDEXABLE).querySelector('meta[name=robots]'), page).toBeNull()
    }
  })
})
