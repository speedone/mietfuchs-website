// Ziele der Download-Knöpfe: die Dateien des neuesten Release mit fester Version im Link
// (releases/download/v0.14.1/…). Ein Link über releases/latest/download/ bräuchte den genauen
// Dateinamen des neuesten Release; tragen die Dateien die Version im Namen (Installer, .dmg), zeigte
// er nach einem neuen Release bis zum nächsten Bau ins Leere. Mit fester Version lädt man in dieser
// Zeit noch die vorige Fassung. Fehlt eine Datei im Release, bleibt es bei „latest“.
import { DOWNLOADS, RELEASE_BASE, REPO_URL, type Platform } from './site.ts'

export type LatestRelease = { tag: string; assets: string[] }
export type DownloadKey = Exclude<Platform, 'windows'> | 'windows-exe' // „windows“ führt in den Store

const FILES: Record<DownloadKey, string> = {
  'windows-exe': DOWNLOADS.windows.file,
  'windows-arm': DOWNLOADS['windows-arm'].file,
  macos: DOWNLOADS.macos.file,
  'macos-intel': DOWNLOADS['macos-intel'].file,
  linux: DOWNLOADS.linux.file,
  'linux-arm': DOWNLOADS['linux-arm'].file,
}

export function resolveTargets(release: LatestRelease | null): Record<DownloadKey, string> {
  const out = {} as Record<DownloadKey, string>
  for (const [key, file] of Object.entries(FILES) as [DownloadKey, string][]) {
    out[key] = release?.assets.includes(file)
      ? `${REPO_URL}/releases/download/${encodeURIComponent(release.tag)}/${file}`
      : RELEASE_BASE + file
  }
  return out
}
