// Kontaktformular ohne Fremddienst: Prüfung, Spam-Schutz (Honigtopf, Mindestzeit) und Versand über
// Cloudflare Email Routing. Ohne JavaScript fehlt der Zeitstempel; das gilt nicht als Spam.
import { CONTACT_EMAIL } from '../../src/lib/site.ts'

export interface Mailer {
  send(subject: string, text: string, replyTo: string): Promise<void>
}

export type ContactResult = { ok: true; name: string; email: string; message: string } | { ok: false; reason: 'spam' | 'invalid' }

const MIN_FILL_MS = 3000
const field = (form: FormData, name: string): string => {
  const v = form.get(name)
  return typeof v === 'string' ? v.trim() : ''
}

export function validateContact(form: FormData, now: number): ContactResult {
  if (field(form, 'website') !== '') return { ok: false, reason: 'spam' }
  const t = Number(field(form, 't'))
  if (field(form, 't') !== '' && Number.isFinite(t) && now - t < MIN_FILL_MS) return { ok: false, reason: 'spam' }
  const name = field(form, 'name')
  const email = field(form, 'email')
  const message = field(form, 'message')
  const emailOk = email.length <= 200 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  if (name.length < 1 || name.length > 100 || !emailOk || message.length < 10 || message.length > 5000) return { ok: false, reason: 'invalid' }
  return { ok: true, name, email, message }
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

function page(status: number, title: string, body: string): Response {
  const html = `<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${title} | Mietfuchs</title><link rel="icon" href="/favicon.svg">
<style>body{font:17px/1.6 system-ui,sans-serif;max-width:640px;margin:40px auto;padding:0 16px;color:#0f1115}
label{display:block;font-weight:600;margin-top:16px}input,textarea{width:100%;font:inherit;padding:10px;border:1px solid #c9c9d1;border-radius:8px}
button{margin-top:16px;font:inherit;font-weight:650;background:#4f46e5;color:#fff;border:0;border-radius:10px;padding:12px 18px}
.error{background:#fff4e5;border:1px solid #f0b46a;border-radius:8px;padding:12px}</style></head>
<body><p><a href="/">Mietfuchs</a></p><h1>${title}</h1>${body}</body></html>`
  return new Response(html, { status, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function formAgain(form: FormData): string {
  const v = (n: string): string => escapeHtml(field(form, n))
  return `<form method="post" action="/api/kontakt">
<label for="name">Name</label><input id="name" name="name" required maxlength="100" value="${v('name')}">
<label for="email">E-Mail-Adresse</label><input id="email" name="email" type="email" required maxlength="200" value="${v('email')}">
<label for="message">Nachricht (mindestens 10 Zeichen)</label><textarea id="message" name="message" required minlength="10" maxlength="5000" rows="7">${v('message')}</textarea>
<button type="submit">Nachricht senden</button></form>`
}

export async function handleContact(req: Request, mailer: Mailer, now: number): Promise<Response> {
  if (req.method !== 'POST') return new Response('Nur POST', { status: 405, headers: { Allow: 'POST' } })
  const form = await req.formData()
  const result = validateContact(form, now)
  if (!result.ok && result.reason === 'spam') return new Response(null, { status: 303, headers: { Location: '/kontakt/danke' } })
  if (!result.ok) {
    return page(400, 'Nachricht nicht gesendet', `<p class="error" role="alert">Bitte prüfen Sie Ihre Angaben: Name, eine gültige E-Mail-Adresse und eine Nachricht mit mindestens 10 Zeichen.</p>${formAgain(form)}`)
  }
  const text = `Name: ${result.name}\nE-Mail: ${result.email}\n\n${result.message}\n`
  try {
    await mailer.send(`Mietfuchs-Website: Nachricht von ${result.name}`, text, result.email)
  } catch {
    return page(502, 'Nachricht nicht gesendet', `<p class="error" role="alert">Der Versand hat gerade nicht geklappt. Bitte schreiben Sie direkt an <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.</p>`)
  }
  return new Response(null, { status: 303, headers: { Location: '/kontakt/danke' } })
}

// Einfache MIME-Nachricht (Text, UTF-8). Zeilenumbrüche in Kopfwerten werden entfernt, damit niemand
// über Betreff oder Absender weitere Kopfzeilen (etwa Bcc) einschleusen kann.
const header = (s: string): string => s.replace(/[\r\n]+/g, ' ').trim()
const b64 = (s: string): string => {
  const bytes = new TextEncoder().encode(s)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin)
}

export function buildMime(m: { from: string; to: string; replyTo: string; subject: string; text: string }): string {
  const body = b64(m.text).replace(/.{1,76}/g, '$&\r\n')
  return [
    `From: Mietfuchs-Website <${header(m.from)}>`,
    `To: ${header(m.to)}`,
    `Reply-To: ${header(m.replyTo)}`,
    `Subject: =?UTF-8?B?${b64(header(m.subject))}?=`,
    `Message-ID: <${crypto.randomUUID()}@mietfuchs-app.de>`,
    `Date: ${new Date().toUTCString()}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    body,
  ].join('\r\n')
}
