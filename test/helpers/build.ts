// Baut die Seite vor allen Tests, nacheinander (parallele Astro-Builds teilen sich den Cache in .astro
// und stören sich gegenseitig):
//   dist/              wie ausgeliefert, solange die Impressumsadresse fehlt (noindex)
//   dist-indexable/    mit Adresse und Schalter (test/build/legal.test.ts)
//   dist-testcontent/  mit den Testinhalten aus src/content/ratgeber/_*.mdx (test/build/guide.test.ts)
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

export const TEST_ADDRESS = 'c/o Test, Teststr. 1, 12345 Teststadt'

function build(outDir: string, extra: Record<string, string>): void {
  fs.rmSync(outDir, { recursive: true, force: true })
  const env = { ...process.env, SITE_INDEXABLE: '', IMPRESSUM_ADDRESS: '', INCLUDE_TEST_CONTENT: '', STATS_OFFLINE: '1', ...extra }
  execFileSync('npx', ['astro', 'build', '--silent', '--outDir', outDir], { stdio: 'inherit', env })
}

export default function setup(): void {
  build('dist', {})
  build('dist-indexable', { SITE_INDEXABLE: '1', IMPRESSUM_ADDRESS: TEST_ADDRESS })
  build('dist-testcontent', { INCLUDE_TEST_CONTENT: '1' })
}
