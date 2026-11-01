// Ob Suchmaschinen die Seite aufnehmen dürfen. Ohne Impressumsadresse darf die Seite nicht öffentlich
// auffindbar sein (§ 5 DDG, § 18 MStV); deshalb braucht es den Schalter und die Adresse zusammen.
export type IndexingEnv = { SITE_INDEXABLE?: string; IMPRESSUM_ADDRESS?: string }

export function isIndexable(env: IndexingEnv): boolean {
  return env.SITE_INDEXABLE === '1' && (env.IMPRESSUM_ADDRESS ?? '').trim() !== ''
}

// Der Stand beim Bauen (process.env), damit Seiten, robots.txt und Sitemap dieselbe Antwort geben.
export const indexableAtBuild = (): boolean => isIndexable(process.env)
