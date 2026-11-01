// Zahlen für die Seite (Downloads, Stars, Version), beim Bauen von der GitHub-API geholt.
// Fehlt eine Antwort, gilt der zuletzt bekannte Stand aus stats-fallback.json: Die Seite zeigt
// nie 0, „NaN“ oder „undefined“, und der Build bricht nicht ab.
import fallback from '../data/stats-fallback.json' with { type: 'json' }

export type Stats = { downloads: number; stars: number; version: string; releasedAt: string; highlights: string[] }

const API = 'https://api.github.com/repos/speedone/mietfuchs'

type Release = { tag_name: string; published_at: string | null; draft: boolean; prerelease: boolean; body?: string | null; assets: { download_count: number }[] }

async function getJson<T>(fetchImpl: typeof fetch, url: string): Promise<T | null> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': 'mietfuchs-website' }
  const token = process.env.GITHUB_TOKEN
  if (token) headers.Authorization = `Bearer ${token}`
  try {
    const res = await fetchImpl(url, { headers })
    return res.ok ? ((await res.json()) as T) : null
  } catch {
    return null
  }
}

async function getReleases(fetchImpl: typeof fetch): Promise<Release[] | null> {
  const all: Release[] = []
  for (let page = 1; page <= 10; page++) {
    const batch = await getJson<Release[]>(fetchImpl, `${API}/releases?per_page=100&page=${page}`)
    if (!batch) return page === 1 ? null : all
    all.push(...batch)
    if (batch.length < 100) break
  }
  return all
}

export async function getStats(fetchImpl: typeof fetch = fetch): Promise<Stats> {
  if (process.env.STATS_OFFLINE === '1') return { ...fallback, highlights: [...fallback.highlights] }
  const [repo, releases] = await Promise.all([getJson<{ stargazers_count?: number }>(fetchImpl, API), getReleases(fetchImpl)])
  const published = (releases ?? []).filter((r) => !r.draft && !r.prerelease && r.published_at)
  const downloads = (releases ?? []).flatMap((r) => r.assets).reduce((sum, a) => sum + (a.download_count || 0), 0)
  const latest = published.sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))[0]
  return {
    downloads: downloads > 0 ? downloads : fallback.downloads,
    stars: typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : fallback.stars,
    version: latest ? latest.tag_name.replace(/^v/, '') : fallback.version,
    releasedAt: latest?.published_at ? latest.published_at.slice(0, 10) : fallback.releasedAt,
    highlights: latest ? releaseHighlights(latest.body ?? '') : [...fallback.highlights],
  }
}

// Die ersten drei Punkte der Release-Notizen unter „Hinzugefügt“ (sonst „Behoben“), gekürzt auf den
// Titel: bis zum Doppelpunkt oder zur Issue-Nummer, ohne Fettdruck. Für „Was ist neu“.
export function releaseHighlights(body: string): string[] {
  const section = (name: string): string[] => {
    const m = new RegExp(`^###\\s*${name}\\s*$([\\s\\S]*?)(?=^###\\s|$(?![\\s\\S]))`, 'm').exec(body)
    return m ? [...(m[1] ?? '').matchAll(/^-\s+(.+)$/gm)].map((x) => x[1] ?? '') : []
  }
  const items = section('Hinzugefügt').length ? section('Hinzugefügt') : section('Behoben')
  return items.slice(0, 3).map((line) => line.replace(/\*\*/g, '').split(/:\s|\s\(#\d+\)/)[0]?.trim() ?? '').filter(Boolean)
}

export const formatCount = (n: number): string => n.toLocaleString('de-DE')

// Ein Abruf je Build: Kopf, Startseite und „Herunterladen“ brauchen dieselben Zahlen, und jede
// Seite einzeln zu fragen, liefe beim Bauen schnell ins Rate-Limit der GitHub-API.
export function createStatsCache(fetchImpl: typeof fetch = fetch): () => Promise<Stats> {
  let pending: Promise<Stats> | null = null
  return () => (pending ??= getStats(fetchImpl))
}

export const cachedStats = createStatsCache()
