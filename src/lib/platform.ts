// Welches System der Besucher nutzt, für den Text und das Ziel des Download-Knopfs. Handys und
// Tablets bekommen bewusst keinen Desktop-Download: Mietfuchs läuft auf dem Computer.
export type DetectedPlatform = 'windows' | 'macos' | 'linux' | 'mobile' | 'unknown'

// `uaDataPlatform`: navigator.userAgentData?.platform (Chromium). `maxTouchPoints`: navigator.maxTouchPoints;
// ein iPad meldet sich im User-Agent als „Macintosh“ und ist nur daran zu erkennen.
export function detectPlatform(ua: string, uaDataPlatform?: string, maxTouchPoints?: number): DetectedPlatform {
  if (uaDataPlatform === 'iOS' || uaDataPlatform === 'Android') return 'mobile'
  if (/iPhone|iPad|iPod|Android|Mobile/i.test(ua)) return 'mobile'
  if (/CrOS/.test(ua)) return 'unknown'
  if (uaDataPlatform === 'Windows' || /Windows NT/.test(ua)) return 'windows'
  if (uaDataPlatform === 'macOS' || /Macintosh|Mac OS X/.test(ua)) return (maxTouchPoints ?? 0) > 1 ? 'mobile' : 'macos'
  if (uaDataPlatform === 'Linux' || /Linux|X11/.test(ua)) return 'linux'
  return 'unknown'
}

// Ziel und Text des Download-Knopfs im Seitenkopf für das erkannte System. Auf dem Mac lässt sich der Chip im
// Browser nicht sicher erkennen; der Knopf nimmt Apple-Chip, die Intel-Fassung steht auf /herunterladen.
export function headerDownload(platform: DetectedPlatform): { href: string; label: string } | null {
  if (platform === 'windows') return { href: '/download/windows', label: 'Für Windows laden' }
  if (platform === 'macos') return { href: '/download/macos', label: 'Für Mac laden' }
  if (platform === 'linux') return { href: '/download/linux', label: 'Für Linux laden' }
  return null
}
