// Abrechnungsfrist: „spätestens bis zum Ablauf des zwölften Monats nach Ende des Abrechnungszeitraums“
// (§ 556 Abs. 3 Satz 2 BGB). Fristende nach § 188 Abs. 2 BGB am Tag mit derselben Zahl, fehlt er im
// Zielmonat, am Monatsletzten (§ 188 Abs. 3 BGB). Gerechnet in UTC.
const ISO = /^(\d{4})-(\d{2})-(\d{2})$/

export function settlementDeadline(periodEnd: string): string {
  const m = ISO.exec(periodEnd)
  if (!m) throw new RangeError(`Kein Datum im Format JJJJ-MM-TT: ${periodEnd}`)
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const end = new Date(Date.UTC(y, mo - 1, d))
  if (end.getUTCFullYear() !== y || end.getUTCMonth() !== mo - 1 || end.getUTCDate() !== d) throw new RangeError(`Ungültiges Datum: ${periodEnd}`)
  const lastOfTarget = new Date(Date.UTC(y + 1, mo, 0)).getUTCDate()
  const result = new Date(Date.UTC(y + 1, mo - 1, Math.min(d, lastOfTarget)))
  return result.toISOString().slice(0, 10)
}
