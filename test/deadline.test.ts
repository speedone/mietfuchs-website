import { describe, expect, it } from 'vitest'
import { settlementDeadline } from '../src/lib/deadline.ts'

describe('settlementDeadline (§ 556 Abs. 3 Satz 2 BGB, §§ 188 Abs. 2 und 3 BGB)', () => {
  it('endet zwölf Monate nach Ende des Zeitraums', () => {
    expect(settlementDeadline('2025-12-31')).toBe('2026-12-31')
    expect(settlementDeadline('2026-04-30')).toBe('2027-04-30')
    expect(settlementDeadline('2025-06-15')).toBe('2026-06-15')
  })
  it('fällt auf den Monatsletzten, wenn der Tag im Zielmonat fehlt', () => {
    expect(settlementDeadline('2024-02-29')).toBe('2025-02-28')
  })
  it('lehnt ungültige Daten ab', () => {
    expect(() => settlementDeadline('2025-02-30')).toThrow(RangeError)
    expect(() => settlementDeadline('31.12.2025')).toThrow(RangeError)
  })
})
