import { describe, expect, it } from 'vitest'
import { heatingSplit } from '../src/lib/heatingSplit.ts'

const base = { totalCents: 480000, consumptionPercent: 70, unitArea: 72, totalArea: 340, unitConsumption: 48, totalConsumption: 210 }

describe('heatingSplit (§ 7 Abs. 1 HeizkostenV)', () => {
  it('teilt nach Fläche und Verbrauch und rundet je Anteil auf Cent', () => {
    expect(heatingSplit(base)).toEqual({ areaCents: 30494, consumptionCents: 76800, totalCents: 107294 })
  })
  it('erlaubt nur 50 bis 70 % nach Verbrauch', () => {
    expect(() => heatingSplit({ ...base, consumptionPercent: 75 })).toThrow(RangeError)
    expect(() => heatingSplit({ ...base, consumptionPercent: 45 })).toThrow(RangeError)
    expect(heatingSplit({ ...base, consumptionPercent: 50 }).totalCents).toBe(Math.round(240000 * 72 / 340) + Math.round(240000 * 48 / 210))
  })
  it('lehnt leere Gesamtwerte und Anteile über dem Ganzen ab', () => {
    expect(() => heatingSplit({ ...base, totalArea: 0 })).toThrow(RangeError)
    expect(() => heatingSplit({ ...base, totalConsumption: 0 })).toThrow(RangeError)
    expect(() => heatingSplit({ ...base, unitArea: 400 })).toThrow(RangeError)
  })
})
