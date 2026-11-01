import type { APIRoute } from 'astro'
import { indexableAtBuild } from '../lib/indexing.ts'

export const GET: APIRoute = () => {
  const body = indexableAtBuild()
    ? 'User-agent: *\nAllow: /\nDisallow: /download/\n\nSitemap: https://mietfuchs-app.de/sitemap-index.xml\n'
    : 'User-agent: *\nDisallow: /\n'
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
