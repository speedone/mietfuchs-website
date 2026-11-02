import { describe, expect, it } from 'vitest'
import { readDistText } from '../helpers/dist.ts'
import { RELEASE_BASE, REPO_URL } from '../../src/lib/site.ts'

// Die Download-Funktion (functions/download/[platform].ts) liest diese Datei, um auf die Dateien des
// neuesten Release mit fester Version zu verweisen. Ohne Netz (Testbau) bleibt es bei „latest“.
describe('/download-targets.json', () => {
  it('nennt für jede Plattform außer Windows (Store) ein Ziel in den Releases von Mietfuchs', () => {
    const t = JSON.parse(readDistText('download-targets.json')) as Record<string, string>
    expect(Object.keys(t).sort()).toEqual(['linux', 'linux-arm', 'macos', 'macos-intel', 'windows-arm', 'windows-exe'])
    for (const url of Object.values(t)) expect(url.startsWith(`${REPO_URL}/releases/`)).toBe(true)
    expect(t['windows-exe']).toBe(`${RELEASE_BASE}mietfuchs-win.exe`)
  })
})
