// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import mdx from '@astrojs/mdx'
import externalLinks from './integrations/external-links.mjs'
import { indexableAtBuild } from './src/lib/indexing.ts'

const indexable = indexableAtBuild()

export default defineConfig({
  site: 'https://mietfuchs-app.de',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Die Sitemap gibt es nur, solange Suchmaschinen die Seite aufnehmen dürfen (src/lib/indexing.ts).
  // Skripte als eigene Dateien unter /_astro/ statt inline: Die CSP (public/_headers) erlaubt nur
  // script-src 'self'; inline würden sie im Betrieb blockiert (scripts/check-pages.mjs prüft das).
  vite: { build: { assetsInlineLimit: 0 } },
  // Impressum, Datenschutz und 404 tragen noindex und gehören nicht in die Sitemap.
  integrations: indexable ? [mdx(), externalLinks(), sitemap({ filter: (page) => !/\/(impressum|datenschutz|404)$/.test(page) })] : [mdx(), externalLinks()],
})
