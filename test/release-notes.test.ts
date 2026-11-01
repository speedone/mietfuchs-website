import { describe, expect, it } from 'vitest'
import { releaseHighlights } from '../src/lib/stats.ts'

const BODY = `> **Hinweis für Mac-Nutzer (Safari):** Safari druckt ohne Briefpapier.

### Hinzugefügt

- Umsatzsteuer bei getrennt vermieteter Garage oder Stellplatz (#323), nur benannt, nicht gerechnet: Die Anleitung erklärt …
- **Einnahmen nach Zeilen der Anlage V:** Tabelle, Hinweise und Einnahmen.csv (#312).
- Seite „Belege“ mit Eingang und Ordner: alles an einem Ort.
- Vierter Punkt, der nicht mehr angezeigt wird.

### Behoben

- Ein Fehler, der nicht unter „Neu“ gehört.`

describe('releaseHighlights', () => {
  it('nimmt die ersten drei Punkte unter „Hinzugefügt“, nur bis zum Doppelpunkt, ohne Issue-Nummern und Auszeichnung', () => {
    expect(releaseHighlights(BODY)).toEqual([
      'Umsatzsteuer bei getrennt vermieteter Garage oder Stellplatz',
      'Einnahmen nach Zeilen der Anlage V',
      'Seite „Belege“ mit Eingang und Ordner',
    ])
  })
  it('nimmt „Behoben“, wenn es nichts Neues gibt, und liefert sonst eine leere Liste', () => {
    expect(releaseHighlights('### Behoben\n\n- Aufgeteilte Rechnungen (#454): Text')).toEqual(['Aufgeteilte Rechnungen'])
    expect(releaseHighlights('')).toEqual([])
    expect(releaseHighlights('Nur Fließtext ohne Liste')).toEqual([])
  })
})
