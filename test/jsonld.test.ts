import { describe, expect, it } from 'vitest'
import { breadcrumbLd, faqLd, softwareAppLd } from '../src/lib/jsonld.ts'

const stats = { downloads: 510, stars: 12, version: '0.14.0', releasedAt: '2026-11-01', highlights: [] }

describe('softwareAppLd', () => {
  it('beschreibt Mietfuchs als kostenloses Programm mit Version', () => {
    const ld = softwareAppLd(stats) as Record<string, any>
    expect(ld['@type']).toBe('SoftwareApplication')
    expect(ld.name).toBe('Mietfuchs')
    expect(ld.offers.price).toBe('0')
    expect(ld.offers.priceCurrency).toBe('EUR')
    expect(ld.softwareVersion).toBe('0.14.0')
    expect(ld.operatingSystem).toBe('Windows, macOS, Linux')
    expect(ld.author).toEqual({ '@type': 'Person', name: 'Martin Geörger' })
  })
})

describe('faqLd und breadcrumbLd', () => {
  it('baut FAQPage mit Fragen und Antworten', () => {
    const ld = faqLd([{ q: 'Kostet das etwas?', a: 'Nein.' }]) as Record<string, any>
    expect(ld['@type']).toBe('FAQPage')
    expect(ld.mainEntity[0]).toEqual({ '@type': 'Question', name: 'Kostet das etwas?', acceptedAnswer: { '@type': 'Answer', text: 'Nein.' } })
  })
  it('baut BreadcrumbList mit absoluten Adressen und Positionen ab 1', () => {
    const ld = breadcrumbLd([{ name: 'Startseite', path: '/' }, { name: 'Ratgeber', path: '/ratgeber' }]) as Record<string, any>
    expect(ld.itemListElement[1]).toEqual({ '@type': 'ListItem', position: 2, name: 'Ratgeber', item: 'https://mietfuchs-app.de/ratgeber' })
  })
})
