import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { DIST, listDistPages, readDist } from '../helpers/dist.ts'

describe('Seitenbestand', () => {
  it('hat kein Kontaktformular und verlinkt keines', () => {
    expect(listDistPages()).not.toContain('/kontakt')
    expect(fs.existsSync('functions/api/kontakt.ts')).toBe(false)
    for (const page of listDistPages()) {
      expect(readDist(page).querySelector('a[href="/kontakt"], form[action="/api/kontakt"]'), page).toBeNull()
    }
  })

  it('liefert eine eigene 404-Seite (sonst schaltet Cloudflare Pages in den SPA-Modus)', () => {
    expect(fs.existsSync(`${DIST}/404.html`)).toBe(true)
    const doc = readDist('/404')
    expect(doc.querySelector('h1')?.text).toMatch(/nicht gefunden/i)
    expect(doc.querySelector('main a[href="/"]')).not.toBeNull()
    expect(doc.querySelector('main a[href="/ratgeber"]')).not.toBeNull()
  })
})

describe('Download-Links', () => {
  it('tragen nofollow, damit Crawler die Zähler nicht verfälschen', () => {
    for (const page of listDistPages()) {
      for (const a of readDist(page).querySelectorAll('a[href^="/download/"]')) {
        expect(a.getAttribute('rel') ?? '', `${page} ${a.getAttribute('href')}`).toContain('nofollow')
      }
    }
  })
})

describe('/herunterladen am Handy', () => {
  it('sagt gleich oben, dass Mietfuchs auf dem Computer läuft', () => {
    const doc = readDist('/herunterladen')
    const intro = doc.querySelector('[data-mobile-hint]')
    expect(intro?.text).toMatch(/Computer/)
    expect(intro?.text).toMatch(/Heimnetz/)
    expect(intro?.querySelector('a[href="#handy"]')).not.toBeNull()
    const html = doc.querySelector('main')?.innerHTML ?? ''
    expect(html.indexOf('data-mobile-hint')).toBeLessThan(html.indexOf('id="windows"'))
  })
})

// Nutzerwunsch 02.11.: Der Knopf im Seitenkopf heißt „Herunterladen“ und führt immer zur Seite, auch mit erkanntem System
describe('Kopf', () => {
  it('„Herunterladen“ führt zur Seite /herunterladen, ohne Umschreiben je System', () => {
    const a = readDist('/').querySelector('header a.dl')
    expect(a?.getAttribute('href')).toBe('/herunterladen')
    expect(a?.text.trim()).toBe('Herunterladen')
    expect(fs.readFileSync('src/components/Header.astro', 'utf8')).not.toMatch(/headerDownload/)
  })
})
