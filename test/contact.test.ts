import { describe, expect, it } from 'vitest'
import { buildMime, handleContact, validateContact, type Mailer } from '../functions/_lib/contact.ts'

const NOW = 1_800_000_000_000
function form(fields: Record<string, string>): FormData {
  const f = new FormData()
  for (const [k, v] of Object.entries(fields)) f.set(k, v)
  return f
}
const valid = { name: 'Erika Muster', email: 'erika@example.org', message: 'Wie übernehme ich die Abrechnung des Messdienstes?', website: '', t: String(NOW - 20_000) }
function mailer(fail = false): Mailer & { sent: { subject: string; text: string; replyTo: string }[] } {
  const sent: { subject: string; text: string; replyTo: string }[] = []
  return { sent, async send(subject, text, replyTo) { if (fail) throw new Error('kaputt'); sent.push({ subject, text, replyTo }) } }
}
const post = (fields: Record<string, string>): Request =>
  new Request('https://mietfuchs-app.de/api/kontakt', { method: 'POST', body: form(fields) })

describe('validateContact', () => {
  it('nimmt eine gültige Nachricht an', () => {
    expect(validateContact(form(valid), NOW)).toEqual({ ok: true, name: 'Erika Muster', email: 'erika@example.org', message: valid.message })
  })
  it('erkennt den Honigtopf und zu schnelles Absenden als Spam', () => {
    expect(validateContact(form({ ...valid, website: 'http://spam' }), NOW)).toEqual({ ok: false, reason: 'spam' })
    expect(validateContact(form({ ...valid, t: String(NOW - 1000) }), NOW)).toEqual({ ok: false, reason: 'spam' })
  })
  it('wertet fehlenden Zeitstempel (ohne JavaScript) nicht als Spam', () => {
    const { t: _t, ...noJs } = valid
    expect(validateContact(form(noJs), NOW).ok).toBe(true)
  })
  it('lehnt zu kurze Nachrichten und ungültige Adressen ab', () => {
    expect(validateContact(form({ ...valid, message: 'kurz' }), NOW)).toEqual({ ok: false, reason: 'invalid' })
    expect(validateContact(form({ ...valid, email: 'keine-adresse' }), NOW)).toEqual({ ok: false, reason: 'invalid' })
    expect(validateContact(form({ ...valid, email: 'a@b@c' }), NOW)).toEqual({ ok: false, reason: 'invalid' })
    expect(validateContact(form({ ...valid, name: '' }), NOW)).toEqual({ ok: false, reason: 'invalid' })
  })
})

describe('handleContact', () => {
  it('schickt eine gültige Nachricht und leitet auf „Danke“', async () => {
    const m = mailer()
    const res = await handleContact(post(valid), m, NOW)
    expect(res.status).toBe(303)
    expect(res.headers.get('Location')).toBe('/kontakt/danke')
    expect(m.sent).toHaveLength(1)
    expect(m.sent[0]?.subject.startsWith('Mietfuchs-Website:')).toBe(true)
    expect(m.sent[0]?.replyTo).toBe('erika@example.org')
    expect(m.sent[0]?.text).toContain(valid.message)
  })
  it('leitet Spam still auf „Danke“, ohne zu senden', async () => {
    const m = mailer()
    const res = await handleContact(post({ ...valid, website: 'x' }), m, NOW)
    expect(res.status).toBe(303)
    expect(m.sent).toHaveLength(0)
  })
  it('zeigt bei ungültigen Angaben das Formular mit Fehler und den Eingaben, sicher escaped', async () => {
    const res = await handleContact(post({ ...valid, name: '<script>x</script>', message: 'kurz' }), mailer(), NOW)
    expect(res.status).toBe(400)
    const html = await res.text()
    expect(html).toContain('Bitte prüfen Sie')
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;')
    expect(html).not.toContain('<script>x</script>')
  })
  it('meldet einen Versandfehler mit der E-Mail-Adresse als Ausweg', async () => {
    const res = await handleContact(post(valid), mailer(true), NOW)
    expect(res.status).toBe(502)
    expect(await res.text()).toContain('kontakt@mietfuchs-app.de')
  })
  it('nimmt nur POST an', async () => {
    const res = await handleContact(new Request('https://mietfuchs-app.de/api/kontakt'), mailer(), NOW)
    expect(res.status).toBe(405)
  })
})

describe('buildMime', () => {
  it('kodiert Betreff und Text in UTF-8 und verhindert Kopfzeilen-Einschleusung', () => {
    const raw = buildMime({ from: 'website@mietfuchs-app.de', to: 'ziel@example.org', replyTo: 'a@b.de\r\nBcc: x@y.z', subject: 'Größe\r\nBcc: x', text: 'Äpfel' })
    expect(raw).toContain('Subject: =?UTF-8?B?')
    expect(raw).not.toMatch(/^Bcc:/m)
    expect(raw).toContain('Content-Transfer-Encoding: base64')
  })
})
