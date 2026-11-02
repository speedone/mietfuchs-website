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
    expect(text).not.toMatch(/Telefon|Kontaktformular/)
  })
  it('benennt für die Ratgeber einen Verantwortlichen nach § 18 Abs. 2 MStV', () => {
    expect(readDist('/impressum').querySelector('main')?.text ?? '').toMatch(/Verantwortlich nach § 18 Abs\. 2 MStV\s*Martin Geörger/)
  })
  it('beschreibt in der Datenschutzerklärung, was wirklich passiert', () => {
    const text = readDist('/datenschutz').querySelector('main')?.text ?? ''
    for (const s of ['Cloudflare', 'Server-Logs', 'Download', 'keine IP', 'E-Mail', 'keine Cookies', 'Art. 6 Abs. 1 lit. f DSGVO', 'Beschwerde', 'Auskunft']) {
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
    expect(robots).toContain('Disallow: /download/') // Crawler sollen die Download-Zähler nicht verfälschen
  })
  const PRIVATE = ['/impressum', '/datenschutz', '/404']
  it('trägt auf keiner Inhaltsseite noindex', () => {
    for (const page of listDistPages(INDEXABLE).filter((p) => !PRIVATE.includes(p))) {
      expect(readDist(page, INDEXABLE).querySelector('meta[name=robots]'), page).toBeNull()
    }
  })
  it('hält Impressum, Datenschutz und 404 aus den Suchmaschinen', () => {
    for (const page of PRIVATE) {
      expect(readDist(page, INDEXABLE).querySelector('meta[name=robots]')?.getAttribute('content'), page).toContain('noindex')
    }
    const sitemap = fs.readdirSync(INDEXABLE).filter((f) => f.startsWith('sitemap')).map((f) => fs.readFileSync(`${INDEXABLE}/${f}`, 'utf8')).join('')
    for (const page of PRIVATE) expect(sitemap, page).not.toContain(`mietfuchs-app.de${page}<`)
  })
})
