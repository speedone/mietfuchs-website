import { describe, expect, it } from 'vitest'
import { guideSchema } from '../src/lib/guide-schema.ts'

const good = {
  title: 'Nebenkostenabrechnung erstellen: Anleitung',
  description: 'So erstellen Sie die Nebenkostenabrechnung als Vermieter Schritt für Schritt: Kosten sammeln, Umlageschlüssel wählen, Frist einhalten, Abrechnung versenden.',
  keyword: 'nebenkostenabrechnung erstellen',
  answer: 'Sie sammeln die Kosten des Jahres, verteilen sie nach dem vereinbarten Schlüssel und schicken die Abrechnung binnen zwölf Monaten.',
  stand: '11/2026',
  sources: [{ label: '§ 556 BGB', url: 'https://www.gesetze-im-internet.de/bgb/__556.html' }],
  order: 1,
}

describe('guideSchema', () => {
  it('nimmt einen vollständigen Eintrag an', () => {
    expect(guideSchema.safeParse(good).success).toBe(true)
  })
  it('verlangt mindestens eine Quelle', () => {
    expect(guideSchema.safeParse({ ...good, sources: [] }).success).toBe(false)
    const { sources: _s, ...noSources } = good
    expect(guideSchema.safeParse(noSources).success).toBe(false)
  })
  it('begrenzt den Titel auf 60 Zeichen und die Beschreibung auf 120 bis 160', () => {
    expect(guideSchema.safeParse({ ...good, title: 'x'.repeat(61) }).success).toBe(false)
    expect(guideSchema.safeParse({ ...good, description: 'zu kurz' }).success).toBe(false)
    expect(guideSchema.safeParse({ ...good, description: 'x'.repeat(161) }).success).toBe(false)
  })
  it('verlangt den Stand als MM/JJJJ und eine kurze Kernantwort', () => {
    expect(guideSchema.safeParse({ ...good, stand: 'November 2026' }).success).toBe(false)
    expect(guideSchema.safeParse({ ...good, answer: 'x'.repeat(301) }).success).toBe(false)
  })
})
