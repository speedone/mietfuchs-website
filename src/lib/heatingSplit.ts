// Vereinfachte Heizkostenverteilung nach § 7 Abs. 1 HeizkostenV: 50 bis 70 % nach Verbrauch, der Rest
// nach Fläche. Warmwasser, Leerstand, Mieterwechsel und CO₂-Aufteilung rechnet erst Mietfuchs.
export type HeatingSplitInput = {
  totalCents: number
  consumptionPercent: number
  unitArea: number
  totalArea: number
  unitConsumption: number
  totalConsumption: number
}

export function heatingSplit(i: HeatingSplitInput): { areaCents: number; consumptionCents: number; totalCents: number } {
  if (!(i.consumptionPercent >= 50 && i.consumptionPercent <= 70)) throw new RangeError('Nach Verbrauch sind 50 bis 70 % zulässig (§ 7 Abs. 1 HeizkostenV).')
  if (!(i.totalArea > 0) || !(i.totalConsumption > 0)) throw new RangeError('Gesamtfläche und Gesamtverbrauch müssen größer als 0 sein.')
  if (i.unitArea < 0 || i.unitConsumption < 0 || i.unitArea > i.totalArea || i.unitConsumption > i.totalConsumption || i.totalCents < 0) {
    throw new RangeError('Der Anteil der Wohnung darf nicht negativ und nicht größer als das Ganze sein.')
  }
  const consumptionPot = (i.totalCents * i.consumptionPercent) / 100
  const areaPot = i.totalCents - consumptionPot
  const areaCents = Math.round((areaPot * i.unitArea) / i.totalArea)
  const consumptionCents = Math.round((consumptionPot * i.unitConsumption) / i.totalConsumption)
  return { areaCents, consumptionCents, totalCents: areaCents + consumptionCents }
}
