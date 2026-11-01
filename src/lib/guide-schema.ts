// Pflichtfelder jeder Ratgeberseite. Ohne Quelle wird eine Seite nicht gebaut (Spec 6:
// rechtliche Aussagen nur mit Beleg).
import { z } from 'astro/zod'

export const guideSchema = z.object({
  title: z.string().min(10).max(60),
  description: z.string().min(120).max(160),
  keyword: z.string().min(3),
  answer: z.string().min(20).max(300),
  stand: z.string().regex(/^(0[1-9]|1[0-2])\/20\d\d$/),
  sources: z.array(z.object({ label: z.string().min(3), url: z.url().optional() })).min(1),
  faq: z.array(z.object({ q: z.string(), a: z.string() })).optional(),
  howto: z.object({ name: z.string(), steps: z.array(z.string()).min(2) }).optional(),
  order: z.number().int(),
})

export type GuideData = z.infer<typeof guideSchema>
