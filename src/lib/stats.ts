// Zahlen für die Seite (Downloads, Stars, Version), beim Bauen von der GitHub-API geholt.
// Fehlt eine Antwort, gilt der zuletzt bekannte Stand aus stats-fallback.json: Die Seite zeigt
// nie 0, „NaN“ oder „undefined“, und der Build bricht nicht ab.
import fallback from '../data/stats-fallback.json' with { type: 'json' }
import type { LatestRelease } from './download-targets.ts'

export type Stats = { downloads: number; stars: number; version: string; releasedAt: string; highlights: string[]; release: LatestRelease | null }

const API = 'https://api.github.com/repos/speedone/mietfuchs'
// Versionsliste des Docker-Abbilds. Für Container-Pakete liefert die GitHub-API keine Downloadzahl,
// sie steht nur auf dieser Seite; gezählt werden Versionen mit Tag, Seite für Seite.
const DOCKER_VERSIONS = 'https://github.com/users/speedone/packages/container/mietfuchs/versions?filters%5Bversion_type%5D=tagged'

type Release = { tag_name: string; published_at: string | null; draft: boolean; prerelease: boolean; body?: string | null; assets: { name?: string; download_count: number }[] }

// Als Download zählt nur, was jemand zum Installieren lädt: Installer, .dmg, Programme (die
// bisherigen ohne Endung) und Linux-Pakete. latest.yml und .blockmap lädt die Update-Prüfung des
// Programms bei jedem Start; sie und das Store-Paket würden die Zahl aufblähen. Erlaubt ist nur, was
// hier steht, damit eine neue Hilfsdatei nicht unbemerkt mitzählt.
export function isProgramFile(name: string): boolean {
  return /\.(exe|dmg|zip|tar\.gz|deb|rpm|pkg\.tar\.zst|AppImage)$/i.test(name) || /^[^.]+$/.test(name)
}

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

// Downloads der Docker-Versionen mit vollständiger Versionsnummer (0.14.1). Nicht gezählt werden
// main, die Bauten zwischen den Releases und Vorabversionen (0.10.0-rc.1): Die zieht vor allem unsere
// eigene Prüfung. Eine Zahl, die nicht als ganze Zahl dasteht (etwa „1.2k“), macht die Seite
// unbrauchbar (null), damit nichts geschätzt wird.
export function dockerReleaseDownloads(html: string): { rows: number; sum: number } | null {
  const rows = html.split(/<li\b[^>]*class="[^"]*\bBox-row\b/).slice(1)
  let sum = 0
  for (const row of rows) {
    const tags = [...row.matchAll(/<a\b[^>]*class="[^"]*\bLabel\b[^"]*"[^>]*>([^<]+)<\/a>/g)].map((m) => (m[1] ?? '').trim())
    if (!tags.some((t) => /^\d+\.\d+\.\d+$/.test(t))) continue
    const count = /([^<>]*?)\s*<span class="sr-only">Version downloads<\/span>/.exec(row)?.[1]?.trim() ?? ''
    if (!/^\d{1,3}(,\d{3})*$/.test(count)) return null
    sum += Number(count.replace(/,/g, ''))
  }
  return { rows: rows.length, sum }
}

async function getDockerDownloads(fetchImpl: typeof fetch): Promise<number | null> {
  let sum = 0
  for (let page = 1; page <= 10; page++) {
    try {
      const res = await fetchImpl(`${DOCKER_VERSIONS}&page=${page}`, { headers: { 'User-Agent': 'mietfuchs-website' } })
      if (!res.ok) return null
      const parsed = dockerReleaseDownloads(await res.text())
      if (!parsed) return null
      if (parsed.rows === 0) return page === 1 ? null : sum
      sum += parsed.sum
    } catch {
      return null
    }
  }
  return sum
}

// Erwerbe aus dem Microsoft Store (Klicks auf „Laden“; Installationen meldet der Store für so
// wenige Nutzer bisher nicht). Zugang über eine Entra-Anwendung, die in Partner Center nur die
// Erwerbe von Mietfuchs lesen darf (Secrets MSSTORE_*). Der Store meldet mit ein bis zwei Tagen Verzug
// und berechnet frische Tage noch einmal neu; gezeigt wird deshalb nie weniger als der letzte bekannte Stand.
export type StoreEnv = { MSSTORE_TENANT_ID?: string; MSSTORE_CLIENT_ID?: string; MSSTORE_CLIENT_SECRET?: string }
const STORE_ID = '9PMHZ0ZJPZDZ'
const STORE_SINCE = '2026-10-01' // vor der ersten Veröffentlichung im Store

async function getStoreAcquisitions(fetchImpl: typeof fetch, env: StoreEnv): Promise<number | null> {
  const { MSSTORE_TENANT_ID: tenant, MSSTORE_CLIENT_ID: id, MSSTORE_CLIENT_SECRET: secret } = env
  if (!tenant || !id || !secret) return null
  try {
    const tokenRes = await fetchImpl(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'client_credentials', client_id: id, client_secret: secret, scope: 'https://manage.devcenter.microsoft.com/.default' }),
    })
    const token = tokenRes.ok ? ((await tokenRes.json()) as { access_token?: string }).access_token : undefined
    if (!token) return null
    const until = new Date().toISOString().slice(0, 10)
    const url = `https://manage.devcenter.microsoft.com/v1.0/my/analytics/appacquisitions?applicationId=${STORE_ID}&startDate=${STORE_SINCE}&endDate=${until}&aggregationLevel=month&top=10000`
    const res = await fetchImpl(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) return null
    const data = (await res.json()) as { Value?: { acquisitionQuantity?: number }[]; TotalCount?: number }
    if (!Array.isArray(data.Value) || data.Value.length < (data.TotalCount ?? 0)) return null
    return data.Value.reduce((sum, r) => sum + (r.acquisitionQuantity || 0), 0)
  } catch {
    return null
  }
}

export async function getStats(fetchImpl: typeof fetch = fetch, env: StoreEnv = process.env): Promise<Stats> {
  const { dockerDownloads: dockerFallback, storeDownloads: storeFallback, ...base } = fallback
  if (process.env.STATS_OFFLINE === '1') return { ...base, downloads: base.downloads + dockerFallback + storeFallback, highlights: [...base.highlights], release: null }
  const [repo, releases, docker, store] = await Promise.all([
    getJson<{ stargazers_count?: number }>(fetchImpl, API),
    getReleases(fetchImpl),
    getDockerDownloads(fetchImpl),
    getStoreAcquisitions(fetchImpl, env),
  ])
  const published = (releases ?? []).filter((r) => !r.draft && !r.prerelease && r.published_at)
  const downloads = (releases ?? []).flatMap((r) => r.assets).filter((a) => isProgramFile(a.name ?? '')).reduce((sum, a) => sum + (a.download_count || 0), 0)
  const latest = published.sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))[0]
  return {
    downloads: (downloads > 0 ? downloads : fallback.downloads) + (docker && docker > 0 ? docker : dockerFallback) + Math.max(store ?? 0, storeFallback),
    stars: typeof repo?.stargazers_count === 'number' ? repo.stargazers_count : fallback.stars,
    version: latest ? latest.tag_name.replace(/^v/, '') : fallback.version,
    releasedAt: latest?.published_at ? latest.published_at.slice(0, 10) : fallback.releasedAt,
    highlights: latest ? releaseHighlights(latest.body ?? '') : [...fallback.highlights],
    release: latest ? { tag: latest.tag_name, assets: latest.assets.map((a) => a.name ?? '').filter(Boolean) } : null,
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
export function createStatsCache(fetchImpl: typeof fetch = fetch, env: StoreEnv = process.env): () => Promise<Stats> {
  let pending: Promise<Stats> | null = null
  return () => (pending ??= getStats(fetchImpl, env))
}

export const cachedStats = createStatsCache()
