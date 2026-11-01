// Download-Weiterleitung mit Zähler (Spec 7, Datenschutz): gezählt werden nur Tag, Plattform und
// die Herkunftsseite auf dieser Website. Keine IP, kein User-Agent, keine Query.
import { DOWNLOADS, RELEASE_BASE, SITE_URL, STORE_URL, type Platform } from '../../src/lib/site.ts'

export interface DownloadCounter {
  add(day: string, platform: string, source: string): Promise<void>
}

export function targetFor(platform: string): string | null {
  if (platform === 'windows') return STORE_URL
  if (platform === 'windows-exe') return RELEASE_BASE + DOWNLOADS.windows.file
  return Object.hasOwn(DOWNLOADS, platform) ? RELEASE_BASE + DOWNLOADS[platform as Platform].file : null
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

export async function handleDownload(req: Request, platform: string, counter: DownloadCounter, now: Date): Promise<Response> {
  const target = targetFor(platform)
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
