// Datum der letzten Änderung einer Seite für die Sitemap: der letzte Commit an ihren Quelldateien.
import fs from 'node:fs'
import { execFileSync } from 'node:child_process'

const GUIDES = 'src/content/ratgeber'

// Quelldateien zum Pfad einer Seite ('/' ist die Startseite). Die Ratgeber-Übersicht ändert sich mit
// jedem Ratgeber, deshalb zählt dort der ganze Ordner.
export function sourceFiles(pathname: string): string[] {
  const name = pathname.replace(/^\/|\/$/g, '') || 'index'
  const page = `src/pages/${name}.astro`
  if (name === 'ratgeber') return [page, GUIDES]
  if (fs.existsSync(page)) return [page]
  const guide = `${GUIDES}/${name}.mdx`
  return fs.existsSync(guide) ? [guide] : []
}

export type Git = (args: string[]) => string
const runGit: Git = (args) => execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()

// Ohne Datum, wenn Git oder der Verlauf fehlt: In einer flachen Kopie trüge sonst jede Seite das Datum
// des letzten Commits, und ein falsches Datum ist schlechter als keines.
export function lastModified(pathname: string, git: Git = runGit): string | undefined {
  const files = sourceFiles(pathname)
  if (!files.length) return undefined
  try {
    if (git(['rev-parse', '--is-shallow-repository']) !== 'false') return undefined
    return git(['log', '-1', '--format=%cI', '--', ...files]) || undefined
  } catch {
    return undefined
  }
}
