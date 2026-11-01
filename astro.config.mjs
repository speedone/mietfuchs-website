// @ts-check
import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import { indexableAtBuild } from './src/lib/indexing.ts'

const indexable = indexableAtBuild()

export default defineConfig({
  site: 'https://mietfuchs-app.de',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  // Die Sitemap gibt es nur, solange Suchmaschinen die Seite aufnehmen dürfen (src/lib/indexing.ts).
  integrations: indexable ? [sitemap()] : [],
})
