// Baut die Seite einmal vor allen Tests, ohne Umgebungsvariablen für die Indexierung, damit die
// Tests unter test/build/ den gebauten Stand in dist/ prüfen (so, wie er ohne Impressumsadresse ausgeliefert würde).
import { execFileSync } from 'node:child_process'

export default function setup(): void {
  const env = { ...process.env, SITE_INDEXABLE: '', IMPRESSUM_ADDRESS: '', STATS_OFFLINE: '1' }
  execFileSync('npx', ['astro', 'build', '--silent'], { stdio: 'inherit', env })
}
