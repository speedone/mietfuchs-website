import type { APIRoute } from 'astro'
import { cachedStats } from '../lib/stats.ts'

// Für den Abgleich in .github/workflows/deploy.yml: Welches Release kannte der Bau, der gerade online ist?
// Weicht das neueste Release davon ab, baut der Abgleich neu. Ohne Netz beim Bau steht hier null.
export const GET: APIRoute = async () => {
  const stats = await cachedStats()
  return new Response(JSON.stringify({ tag: stats.release?.tag ?? null }), { headers: { 'Content-Type': 'application/json' } })
}
