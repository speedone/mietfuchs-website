import { describe, expect, it } from 'vitest'
import { findCopyViolations } from '../src/lib/copy-rules.ts'

describe('findCopyViolations', () => {
  it('meldet Geviertstrich, Überversprechen und Duzen', () => {
    expect(findCopyViolations('Das ist rechtssicher — du')).toHaveLength(3)
  })
  it('meldet jedes verbotene Versprechen', () => {
    for (const w of ['garantiert korrekt', 'kein Einwand', '100 % korrekt', 'fehlerfrei', 'Rechtssicherheit']) {
      expect(findCopyViolations(w), w).not.toEqual([])
    }
  })
  it('meldet Zusagen, dass es kostenlos bleibt', () => {
    for (const w of ['Mietfuchs bleibt kostenlos.', 'für immer kostenlos', 'dauerhaft kostenlos', 'Es wird immer kostenlos sein']) {
      expect(findCopyViolations(w), w).not.toEqual([])
    }
    expect(findCopyViolations('Mietfuchs ist kostenlos.')).toEqual([])
  })
  it('lässt Sie-Texte und Wörter, die „du“ nur enthalten, in Ruhe', () => {
    expect(findCopyViolations('Sie erstellen Ihre Abrechnung. Dutzende Durchläufe, Produkt, Duschen.')).toEqual([])
  })
  it('erkennt Duzen auch am Satzanfang', () => {
    expect(findCopyViolations('Dein Haus. Dir gehört es.')).toHaveLength(2)
  })
})
