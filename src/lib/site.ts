// Feste Adressen und Download-Dateien. Die Dateinamen stehen so in der README und den Release-Notes von
// Mietfuchs (github.com/speedone/mietfuchs).
export const SITE_URL = 'https://mietfuchs-app.de'
export const REPO_URL = 'https://github.com/speedone/mietfuchs'
export const STORE_URL = 'https://apps.microsoft.com/detail/9PMHZ0ZJPZDZ'
export const DONATE_URL = 'https://buymeacoffee.com/speedone'
export const RELEASE_BASE = `${REPO_URL}/releases/latest/download/`
export const AUTHOR = 'Martin Geörger'
export const CONTACT_EMAIL = 'kontakt@mietfuchs-app.de'

// Die einzige Stelle, an der die Version der Download-Dateien gepflegt wird. Installer und Mac-Abbilder
// tragen sie im Namen, deshalb führt releases/latest/download/ dort nicht weiter (nach einem neuen
// Release gäbe es die Datei unter „latest“ nicht mehr). Beim Bauen nimmt die Website die Dateien des
// neuesten Release (src/lib/download-targets.ts); diese Version gilt nur, wenn das Release unbekannt ist.
export const APP_VERSION = '0.18.0'

// „windows“ führt in den Microsoft Store; alle übrigen zu einer Datei am Release.
export type Platform = 'windows' | 'windows-exe' | 'macos' | 'macos-intel' | 'linux' | 'linux-arm'
export type DownloadKey = Exclude<Platform, 'windows'>

// `{version}` steht für die Version ohne „v“ (0.15.0).
export const DOWNLOADS: Record<DownloadKey, { file: string; label: string }> = {
  'windows-exe': { file: 'Mietfuchs-Setup-{version}.exe', label: 'Windows-Installer (Intel/AMD und ARM)' },
  macos: { file: 'Mietfuchs-{version}-apple-silicon.dmg', label: 'macOS (Apple-Chip, M1 und neuer)' },
  'macos-intel': { file: 'Mietfuchs-{version}-intel.dmg', label: 'macOS (Intel)' },
  linux: { file: 'mietfuchs-linux.tar.gz', label: 'Linux' },
  'linux-arm': { file: 'mietfuchs-linux-arm64.tar.gz', label: 'Linux auf ARM (z. B. Raspberry Pi)' },
}

export const DOWNLOAD_KEYS = Object.keys(DOWNLOADS) as DownloadKey[]

export function isDownloadKey(key: string): key is DownloadKey {
  return Object.hasOwn(DOWNLOADS, key)
}

/** Dateiname für eine Version (0.15.0 oder v0.15.0). */
export function downloadFile(key: DownloadKey, version: string = APP_VERSION): string {
  return DOWNLOADS[key].file.replace('{version}', version.replace(/^v/, ''))
}

/** Ziel ohne Wissen über das neueste Release: Dateien ohne Version über „latest“, die übrigen fest auf APP_VERSION. */
export function fallbackUrl(key: DownloadKey): string {
  const file = downloadFile(key)
  return DOWNLOADS[key].file.includes('{version}') ? `${REPO_URL}/releases/download/v${APP_VERSION}/${file}` : RELEASE_BASE + file
}
