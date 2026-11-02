// Download-Weiterleitung mit Zähler (Spec 7, Datenschutz): gezählt werden nur Tag, Plattform und
// die Herkunftsseite auf dieser Website. Keine IP, kein User-Agent, keine Query.
import { REPO_URL, SITE_URL, STORE_URL, fallbackUrl, isDownloadKey } from '../../src/lib/site.ts'

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
  try {
    await counter.add(now.toISOString().slice(0, 10), platform, sourcePath(req.headers.get('Referer'), url.host))
  } catch {
    // Der Zähler darf den Download nie verhindern.
  }
  return new Response(null, { status: 302, headers: { ...headers, Location: target } })
}
