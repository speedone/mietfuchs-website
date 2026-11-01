import { describe, expect, it } from 'vitest'
import { readDist } from '../helpers/dist.ts'

const OUT = 'dist-testcontent'

describe('Ratgeberseite (Beispieleintrag)', () => {
  it('hat Brotkrumen, Kernantwort zuerst, zwei Download-Hinweise, Quellen und den Hinweis zur Rechtsberatung', () => {
    const doc = readDist('/beispiel-ratgeber', OUT)
    const ld = doc.querySelectorAll('script[type="application/ld+json"]').map((s) => JSON.parse(s.text))
    expect(ld.map((d) => d['@type'])).toEqual(expect.arrayContaining(['BreadcrumbList', 'FAQPage', 'HowTo']))
    expect(doc.querySelector('article .answer')?.text.trim()).toBe('Das ist die Kernantwort des Beispiels in einem Satz.')
    expect(doc.querySelector('article .answer')).toBe(doc.querySelector('article p'))
    expect(doc.querySelectorAll('[data-cta=guide]')).toHaveLength(2)
    expect(doc.querySelector('#quellen')?.text).toContain('§ 556 BGB')
    expect(doc.querySelector('main')?.text).toContain('Keine Rechtsberatung')
    expect(doc.querySelector('main')?.text).toContain('Stand: 11/2026')
  })

  it('erscheint in der Ratgeber-Übersicht', () => {
    expect(readDist('/ratgeber', OUT).querySelector('a[href="/beispiel-ratgeber"]')).not.toBeNull()
  })
})
