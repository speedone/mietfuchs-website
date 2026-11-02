import type { APIRoute } from 'astro'
import { resolveTargets } from '../lib/download-targets.ts'
import { cachedStats } from '../lib/stats.ts'

// Gelesen von functions/download/[platform].ts (über ASSETS), nicht für Besucher gedacht.
export const GET: APIRoute = async () =>
  new Response(JSON.stringify(resolveTargets((await cachedStats()).release)), { headers: { 'Content-Type': 'application/json' } })
