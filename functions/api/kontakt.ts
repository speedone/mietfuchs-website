// POST /api/kontakt. MAIL ist das send_email-Binding von Cloudflare Email Routing, CONTACT_TO die dort
// bestätigte Zieladresse. EmailMessage stellt die Laufzeit unter `cloudflare:email` bereit.
// @ts-expect-error Modul der Cloudflare-Laufzeit, lokal ohne Typen
import { EmailMessage } from 'cloudflare:email'
import { buildMime, handleContact, type Mailer } from '../_lib/contact.ts'

type Env = { MAIL: { send(message: unknown): Promise<void> }; CONTACT_TO: string }
const FROM = 'website@mietfuchs-app.de'

export const onRequest = (ctx: { request: Request; env: Env }): Promise<Response> => {
  const mailer: Mailer = {
    async send(subject, text, replyTo) {
      const raw = buildMime({ from: FROM, to: ctx.env.CONTACT_TO, replyTo, subject, text })
      await ctx.env.MAIL.send(new EmailMessage(FROM, ctx.env.CONTACT_TO, raw))
    },
  }
  return handleContact(ctx.request, mailer, Date.now())
}
