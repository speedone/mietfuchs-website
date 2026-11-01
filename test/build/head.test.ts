import { describe, expect, it } from 'vitest'
import { listDistPages, readDist, readDistText } from '../helpers/dist.ts'

const pages = listDistPages()

describe('Kopf jeder gebauten Seite (ohne Impressumsadresse)', () => {
  it('hat Seiten gebaut', () => {
    expect(pages.length).toBeGreaterThan(0)
  })

  it.each(pages)('%s: genau eine h1, lang=de, kanonische Adresse, noindex', (page) => {
    const doc = readDist(page)
    expect(doc.querySelectorAll('h1')).toHaveLength(1)
    expect(doc.querySelector('html')?.getAttribute('lang')).toBe('de')
    const canonical = doc.querySelector('link[rel=canonical]')?.getAttribute('href') ?? ''
    expect(canonical.startsWith('https://mietfuchs-app.de/')).toBe(true)
    expect(doc.querySelector('meta[name=robots]')?.getAttribute('content')).toContain('noindex')
    expect(doc.querySelector('title')?.text.trim()).not.toBe('')
    expect(doc.querySelector('meta[name=description]')?.getAttribute('content')).toBeTruthy()
    expect(doc.querySelector('meta[property="og:image"]')?.getAttribute('content')).toMatch(/^https:\/\/mietfuchs-app\.de\//)
  })

  it.each(pages)('%s: lädt nichts von fremden Servern', (page) => {
    const doc = readDist(page)
    const refs = [
      ...doc.querySelectorAll('script[src], img[src], iframe[src], source[src]').map((e) => e.getAttribute('src') ?? ''),
      ...doc.querySelectorAll('link[href]')
        .filter((e) => !['canonical', 'alternate'].includes(e.getAttribute('rel') ?? ''))
        .map((e) => e.getAttribute('href') ?? ''),
    ]
    for (const ref of refs) expect(ref, ref).not.toMatch(/^(https?:)?\/\//)
  })

  it('robots.txt sperrt alles und nennt keine Sitemap', () => {
    const robots = readDistText('robots.txt')
    expect(robots).toContain('Disallow: /')
    expect(robots).not.toContain('Sitemap:')
  })
})
