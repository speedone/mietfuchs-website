import type { APIRoute, GetStaticPaths } from 'astro'
import { getCollection } from 'astro:content'
import { indexableAtBuild } from '../lib/indexing.ts'
import { buildLlmsTxt } from '../lib/llms.ts'

// /llms.txt gibt es wie die Sitemap nur, solange Suchmaschinen die Seite aufnehmen dürfen
// (src/lib/indexing.ts). Deshalb eine Route mit Parameter: Ohne Pfad entsteht keine Datei.
export const getStaticPaths: GetStaticPaths = () => (indexableAtBuild() ? [{ params: { llms: 'llms' } }] : [])

export const GET: APIRoute = async () => {
  const guides = (await getCollection('ratgeber'))
    .sort((a, b) => a.data.order - b.data.order)
    .map((e) => ({ slug: e.id, title: e.data.title, description: e.data.description }))
  return new Response(buildLlmsTxt(guides), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
