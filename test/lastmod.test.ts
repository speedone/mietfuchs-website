import { describe, expect, it } from 'vitest'
import { lastModified, sourceFiles } from '../src/lib/lastmod.ts'

describe('sourceFiles', () => {
  it('ordnet Startseite, feste Seiten und Ratgeber ihren Quelldateien zu', () => {
    expect(sourceFiles('/')).toEqual(['src/pages/index.astro'])
    expect(sourceFiles('/funktionen')).toEqual(['src/pages/funktionen.astro'])
    expect(sourceFiles('/nebenkostenabrechnung-frist')).toEqual(['src/content/ratgeber/nebenkostenabrechnung-frist.mdx'])
  })
  it('zählt für die Ratgeber-Übersicht auch die Ratgeber selbst', () => {
    expect(sourceFiles('/ratgeber')).toEqual(['src/pages/ratgeber.astro', 'src/content/ratgeber'])
  })
  it('kennt zu einer unbekannten Seite keine Quelle', () => {
    expect(sourceFiles('/gibt-es-nicht')).toEqual([])
  })
})

describe('lastModified', () => {
  const git = (answers: Record<string, string>) => (args: string[]) => answers[args[0] ?? ''] ?? ''
  it('nimmt das Datum des letzten Commits an den Quelldateien', () => {
    expect(lastModified('/funktionen', git({ 'rev-parse': 'false', log: '2026-11-01T10:00:00+01:00' }))).toBe('2026-11-01T10:00:00+01:00')
  })
  it('nennt kein Datum, wenn der Verlauf fehlt, statt das des letzten Commits für alle Seiten', () => {
    expect(lastModified('/funktionen', git({ 'rev-parse': 'true', log: '2026-11-24T10:00:00+01:00' }))).toBeUndefined()
    expect(lastModified('/funktionen', () => { throw new Error('kein git') })).toBeUndefined()
    expect(lastModified('/gibt-es-nicht', git({ 'rev-parse': 'false', log: '2026-11-01T10:00:00+01:00' }))).toBeUndefined()
  })
})
