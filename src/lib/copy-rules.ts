// Regeln für jeden Text der Website (Global Constraints des Plans): Sie-Anrede, kein Geviertstrich,
// keine rechtlich angreifbaren Versprechen. test/build/copy.test.ts prüft damit jede gebaute Seite.
const RULES: { pattern: RegExp; message: string }[] = [
  { pattern: /—/g, message: 'Geviertstrich' },
  { pattern: /rechtssicher\w*/gi, message: 'Versprechen „rechtssicher“' },
  { pattern: /garantiert/gi, message: 'Versprechen „garantiert“' },
  { pattern: /kein(en)? Einwand/gi, message: 'Versprechen „kein Einwand“' },
  { pattern: /100\s?%\s?(korrekt|richtig|sicher)/gi, message: 'Versprechen „100 % korrekt“' },
  { pattern: /fehlerfrei/gi, message: 'Versprechen „fehlerfrei“' },
  // Keine Zusage über die Zukunft: Ob Mietfuchs immer kostenlos bleibt, ist nicht entschieden.
  { pattern: /bleib\w*\s+kostenlos|kostenlos\s+bleib\w*|(für immer|dauerhaft|immer)\s+kostenlos|immer kostenlos sein/gi, message: 'Zusage „bleibt kostenlos“' },
  { pattern: /(?<![\p{L}])(du|dein|deine|deinen|deinem|deiner|deines|dir|dich)(?![\p{L}])/giu, message: 'Duzen' },
]

export function findCopyViolations(text: string): string[] {
  const found: string[] = []
  for (const { pattern, message } of RULES) {
    for (const m of text.matchAll(pattern)) found.push(`${message}: „${m[0]}“`)
  }
  return found
}
