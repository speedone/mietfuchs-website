import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { DIST, listDistPages, readDist } from '../helpers/dist.ts'

const pages = listDistPages()

// Gibt es zu einem internen Link eine Seite oder Datei im Build? (/download/* sind Pages Functions)
function resolves(href: string): boolean {
  const [p = ''] = href.split('#')
  if (p === '' || p.startsWith('/download/')) return true
  const clean = p.split('?')[0] ?? ''
  if (clean === '/') return fs.existsSync(path.join(DIST, 'index.html'))
  return fs.existsSync(path.join(DIST, `${clean}.html`)) || fs.existsSync(path.join(DIST, clean))
}

describe('SEO jeder Seite', () => {
  it.each(pages)('%s: Titel und Beschreibung in sinnvoller Länge, Vorschau vollständig', (page) => {
    const doc = readDist(page)
    const title = doc.querySelector('title')?.text.trim() ?? ''
    const desc = doc.querySelector('meta[name=description]')?.getAttribute('content') ?? ''
    expect(title.length, title).toBeGreaterThanOrEqual(15)
    expect(title.length, title).toBeLessThanOrEqual(70)
    expect(desc.length, desc).toBeGreaterThanOrEqual(50)
    expect(desc.length, desc).toBeLessThanOrEqual(165)
    for (const p of ['og:title', 'og:description', 'og:image', 'og:url']) expect(doc.querySelector(`meta[property="${p}"]`), p).not.toBeNull()
  })

  it.each(pages)('%s: Überschriften ohne übersprungene Ebene', (page) => {
    const levels = readDist(page).querySelectorAll('main h1, main h2, main h3, main h4').map((h) => Number(h.tagName[1]))
    expect(levels[0]).toBe(1)
    for (let i = 1; i < levels.length; i++) expect(levels[i]! - levels[i - 1]!, `Sprung vor der ${i + 1}. Überschrift`).toBeLessThanOrEqual(1)
  })

  it.each(pages)('%s: jedes Bild mit Alt-Text-Angabe und festen Maßen', (page) => {
    for (const img of readDist(page).querySelectorAll('img')) {
      const src = img.getAttribute('src') ?? ''
      expect(img.getAttribute('alt'), src).not.toBeUndefined()
      if (img.closest('dialog')) continue // wird erst beim Öffnen gefüllt
      expect(img.getAttribute('width'), src).toBeTruthy()
      expect(img.getAttribute('height'), src).toBeTruthy()
    }
  })

  it.each(pages)('%s: Inhaltsbilder haben einen beschreibenden Alt-Text', (page) => {
    for (const img of readDist(page).querySelectorAll('main img')) {
      if (img.closest('dialog') || img.closest('[aria-hidden=true]')) continue
      expect((img.getAttribute('alt') ?? '').length, img.getAttribute('src') ?? '').toBeGreaterThan(10)
    }
  })

  it.each(pages)('%s: keine internen Links ins Leere', (page) => {
    const broken = readDist(page).querySelectorAll('a[href^="/"]').map((a) => a.getAttribute('href') ?? '').filter((h) => !resolves(h))
    expect(broken).toEqual([])
  })

  it.each(pages)('%s: Anker auf derselben Seite gibt es', (page) => {
    const doc = readDist(page)
    const missing = doc.querySelectorAll('a[href^="#"]').map((a) => (a.getAttribute('href') ?? '').slice(1)).filter((id) => id && !doc.getElementById(id))
    expect(missing).toEqual([])
  })

  it.each(pages)('%s: strukturierte Daten sind gültiges JSON mit @context', (page) => {
    for (const s of readDist(page).querySelectorAll('script[type="application/ld+json"]')) {
      const data = JSON.parse(s.text) as Record<string, unknown>
      expect(data['@context']).toBe('https://schema.org')
    }
  })
})

describe('Externe Links', () => {
  it.each(pages)('%s: öffnen in neuem Fenster, sicher und mit Hinweis für Screenreader', (page) => {
    for (const a of readDist(page).querySelectorAll('a[href^="http"]')) {
      const href = a.getAttribute('href') ?? ''
      if (href.startsWith('https://mietfuchs-app.de')) continue
      expect(a.getAttribute('target'), href).toBe('_blank')
      expect(a.getAttribute('rel') ?? '', href).toContain('noopener')
      expect(a.querySelectorAll('.visually-hidden').some((s) => s.text.includes('neuem Fenster')), href).toBe(true)
    }
  })
})
