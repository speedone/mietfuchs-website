// Download-Weiterleitung mit Zähler (Spec 7, Datenschutz): gezählt werden nur Tag, Plattform und
// die Herkunftsseite auf dieser Website. Keine IP, kein User-Agent, keine Query.
import { DOWNLOAD_KEYS, REPO_URL, SITE_URL, STORE_URL, downloadFile, fallbackUrl, isDownloadKey } from '../../src/lib/site.ts'

export interface DownloadCounter {
  add(day: string, platform: string, source: string): Promise<void>
}

// Ziele aus dem Build (/download-targets.json, src/lib/download-targets.ts): die Dateien des neuesten
// Release mit fester Version. Genommen wird nur, was in die Releases von Mietfuchs zeigt; sonst gilt
// fallbackUrl (src/lib/site.ts).
const PINNED = new RegExp(`^${REPO_URL.replace(/[.]/g, '\\.')}/releases/download/[\\w.-]+/[\\w.-]+$`)

export function targetFor(platform: string, targets: Record<string, unknown> = {}): string | null {
  if (platform === 'windows') return STORE_URL
  if (!isDownloadKey(platform)) return null
  const pinned = Object.hasOwn(targets, platform) ? targets[platform] : undefined
  return typeof pinned === 'string' && PINNED.test(pinned) && !pinned.includes('..') ? pinned : fallbackUrl(platform)
}

export interface AssetsLike {
  fetch(input: string | URL | Request): Promise<Response>
}

export async function loadTargets(assets: AssetsLike | undefined, requestUrl: string): Promise<Record<string, unknown>> {
  if (!assets) return {}
  try {
    const res = await assets.fetch(new URL('/download-targets.json', requestUrl))
    if (!res.ok) return {}
    const data: unknown = await res.json()
    return data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}

// Das neueste veröffentlichte Release, beim Aufruf von GitHub geholt (ohne Anmeldung) und fünf Minuten
// zwischengespeichert. So führen die Knöpfe gleich nach einem Release auf die neuen Dateien, ohne auf den
// nächsten Bau zu warten. Fällt GitHub aus, antwortet es nicht binnen `timeoutMs` oder fehlt eine Datei am
// Release, fehlt sie hier, und es gilt das Ziel aus dem Bau (loadTargets), zuletzt fallbackUrl.
export interface CacheLike {
  match(request: Request): Promise<Response | undefined>
  put(request: Request, response: Response): Promise<void>
}
const LATEST_API = 'https://api.github.com/repos/speedone/mietfuchs/releases/latest'
const CACHE_KEY = `${SITE_URL}/__cache/latest-release-v1`
const CACHE_SECONDS = 300

async function latestRelease(fetchImpl: typeof fetch, cache: CacheLike | undefined, timeoutMs: number): Promise<{ tag: string; assets: string[] } | null> {
  const key = new Request(CACHE_KEY)
  try {
    const hit = await cache?.match(key)
    if (hit) return (await hit.json()) as { tag: string; assets: string[] }
  } catch {
    // Ohne Zwischenspeicher geht es auch.
  }
  try {
    const res = await fetchImpl(LATEST_API, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'mietfuchs-website' },
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { tag_name?: unknown; assets?: { name?: unknown }[] }
    if (typeof data.tag_name !== 'string' || !Array.isArray(data.assets)) return null
    const release = { tag: data.tag_name, assets: data.assets.map((a) => a.name).filter((n): n is string => typeof n === 'string') }
    try {
      await cache?.put(key, new Response(JSON.stringify(release), { headers: { 'Content-Type': 'application/json', 'Cache-Control': `max-age=${CACHE_SECONDS}` } }))
    } catch {
      // Dann eben beim nächsten Aufruf noch einmal fragen.
    }
    return release
  } catch {
    return null
  }
}

/** Ziele aus dem neuesten Release, nur für Dateien, die dort wirklich liegen. */
export async function liveTargets(fetchImpl: typeof fetch, cache: CacheLike | undefined, timeoutMs = 2000): Promise<Record<string, string>> {
  const release = await latestRelease(fetchImpl, cache, timeoutMs)
  const out: Record<string, string> = {}
  if (!release) return out
  for (const key of DOWNLOAD_KEYS) {
    const file = downloadFile(key, release.tag)
    if (release.assets.includes(file)) out[key] = `${REPO_URL}/releases/download/${encodeURIComponent(release.tag)}/${file}`
  }
  return out
}

export function sourcePath(referer: string | null, host: string): string {
  if (!referer) return 'direkt'
  try {
    const url = new URL(referer)
    return url.host === host ? url.pathname.slice(0, 120) : 'extern'
  } catch {
    return 'extern'
  }
}

export async function handleDownload(req: Request, platform: string, counter: DownloadCounter, now: Date, targets: Record<string, unknown> = {}): Promise<Response> {
  const target = targetFor(platform, targets)
  const headers = { 'Cache-Control': 'no-store' }
  if (!target) return new Response(null, { status: 302, headers: { ...headers, Location: `${SITE_URL}/herunterladen` } })
  const url = new URL(req.url)
  // HEAD (Linkprüfer, Vorschauen) bekommt dieselbe Weiterleitung, zählt aber nicht als Download.
  if (req.method !== 'HEAD') try {
    await counter.add(now.toISOString().slice(0, 10), platform, sourcePath(req.headers.get('Referer'), url.host))
  } catch {
    // Der Zähler darf den Download nie verhindern.
  }
  return new Response(null, { status: 302, headers: { ...headers, Location: target } })
}
