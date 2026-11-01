import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findCopyViolations } from '../../src/lib/copy-rules.ts'
import { DIST, readDist } from '../helpers/dist.ts'

// /llms.txt (Vorschlag llmstxt.org): Kurzfassung der Seite für KI-Werkzeuge, beim Bauen erzeugt.
const INDEXABLE = path.resolve('dist-indexable')
const file = path.join(INDEXABLE, 'llms.txt')
const read = (): string => fs.readFileSync(file, 'utf8')
const guides = fs.readdirSync('src/content/ratgeber').filter((f) => !f.startsWith('_')).map((f) => f.replace(/\.mdx$/, ''))

describe('/llms.txt', () => {
  it('gibt es nur, wenn Suchmaschinen die Seite aufnehmen dürfen (wie die Sitemap)', () => {
    expect(fs.existsSync(file)).toBe(true)
    expect(fs.existsSync(path.join(DIST, 'llms.txt'))).toBe(false)
  })

  it('folgt dem Format: Titel, Zusammenfassung als Zitat, Abschnitte mit Linklisten', () => {
    const lines = read().split('\n')
    expect(lines[0]).toBe('# Mietfuchs')
    expect(lines.find((l) => l.startsWith('> '))).toMatch(/Nebenkostenabrechnung/)
    for (const h of ['## Programm', '## Ratgeber', '## Optional']) expect(lines, h).toContain(h)
    expect(lines.slice(1).some((l) => l.startsWith('#') && !l.startsWith('## ')), 'freier Text ohne Überschriften').toBe(false)
    const sections = lines.slice(lines.indexOf('## Programm'))
    for (const l of sections.filter((x) => x.startsWith('- '))) expect(l).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\)(: .+)?$/)
  })

  it('nennt jede Funktion von /funktionen mit Titel und Text, vor den Linklisten', () => {
    const text = read()
    const titles = readDist('/funktionen', INDEXABLE).querySelectorAll('main li h3').map((h) => h.text.trim())
    expect(titles.length).toBeGreaterThan(10)
    for (const t of titles) {
      const i = text.indexOf(`- ${t}: `)
      expect(i, t).toBeGreaterThan(0)
      expect(i, t).toBeLessThan(text.indexOf('## Programm'))
    }
  })

  it('nennt jeden Ratgeber mit seiner Adresse', () => {
    for (const slug of guides) expect(read(), slug).toContain(`(https://mietfuchs-app.de/${slug})`)
  })

  it('verweist nur auf Seiten, die es im Build gibt', () => {
    const own = [...read().matchAll(/\(https:\/\/mietfuchs-app\.de(\/[^)]*)?\)/g)].map((m) => m[1] ?? '/')
    expect(own.length).toBeGreaterThan(5)
    for (const p of own) {
      const f = p === '/' ? 'index.html' : `${p.slice(1)}.html`
      expect(fs.existsSync(path.join(INDEXABLE, f)), p).toBe(true)
    }
  })

  it('hält die Texteregeln ein und sagt, dass Mietfuchs keine Beratung ersetzt', () => {
    expect(findCopyViolations(read())).toEqual([])
    expect(read()).toMatch(/ersetzt keine Rechts- oder Steuerberatung/)
  })

  it('nennt keine anderen Anbieter (Liste wie in guides.test.ts, nur lokal vorhanden)', () => {
    const names = fs.existsSync('.superpowers/competitors.txt') ? fs.readFileSync('.superpowers/competitors.txt', 'utf8').split('\n').map((s) => s.trim()).filter(Boolean) : []
    for (const n of names) expect(read().toLowerCase()).not.toContain(n.toLowerCase())
  })
})
