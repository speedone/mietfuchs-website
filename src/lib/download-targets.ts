// Ziele der Download-Knöpfe: die Dateien des neuesten Release mit fester Version im Link
// (releases/download/v0.15.0/…). Installer und Mac-Abbilder tragen die Version im Namen; ein Link über
// releases/latest/download/ zeigte nach einem neuen Release bis zum nächsten Bau ins Leere. Mit fester
// Version lädt man in dieser Zeit noch die vorige Fassung. Fehlt eine Datei im Release oder ist es
// unbekannt (Bau ohne Netz), gilt fallbackUrl aus site.ts.
import { DOWNLOAD_KEYS, REPO_URL, downloadFile, fallbackUrl, type DownloadKey } from './site.ts'

export type LatestRelease = { tag: string; assets: string[] }
export type { DownloadKey }

export function resolveTargets(release: LatestRelease | null): Record<DownloadKey, string> {
  const out = {} as Record<DownloadKey, string>
  for (const key of DOWNLOAD_KEYS) {
    const file = release ? downloadFile(key, release.tag) : null
    out[key] = release && file && release.assets.includes(file)
      ? `${REPO_URL}/releases/download/${encodeURIComponent(release.tag)}/${file}`
      : fallbackUrl(key)
  }
  return out
}

/** Dateiname am Ende eines Ziels, für den Linktext. */
export function targetFile(url: string): string {
  return decodeURIComponent(url.slice(url.lastIndexOf('/') + 1))
}
