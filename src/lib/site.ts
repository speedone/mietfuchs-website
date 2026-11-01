// Feste Adressen und Download-Dateien. Die Dateinamen stehen so in der README von Mietfuchs
// (github.com/speedone/mietfuchs) und gelten über /releases/latest/download/ für jedes Release.
export const SITE_URL = 'https://mietfuchs-app.de'
export const REPO_URL = 'https://github.com/speedone/mietfuchs'
export const STORE_URL = 'https://apps.microsoft.com/detail/9PMHZ0ZJPZDZ'
export const DONATE_URL = 'https://buymeacoffee.com/speedone'
export const RELEASE_BASE = `${REPO_URL}/releases/latest/download/`
export const AUTHOR = 'Martin Geörger'
export const CONTACT_EMAIL = 'kontakt@mietfuchs-app.de'

export type Platform = 'windows' | 'windows-arm' | 'macos' | 'macos-intel' | 'linux' | 'linux-arm'

export const DOWNLOADS: Record<Platform, { file: string; label: string }> = {
  windows: { file: 'mietfuchs-win.exe', label: 'Windows' },
  'windows-arm': { file: 'mietfuchs-win-arm64.exe', label: 'Windows auf ARM (z. B. Snapdragon)' },
  macos: { file: 'mietfuchs-macos-apple-silicon.zip', label: 'macOS (Apple-Chip, M1 bis M4)' },
  'macos-intel': { file: 'mietfuchs-macos-intel.zip', label: 'macOS (Intel)' },
  linux: { file: 'mietfuchs-linux.tar.gz', label: 'Linux' },
  'linux-arm': { file: 'mietfuchs-linux-arm64.tar.gz', label: 'Linux auf ARM (z. B. Raspberry Pi)' },
}
