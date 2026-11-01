// Liest die gebaute Seite aus dist/ (globalSetup in test/helpers/build.ts baut sie vorher).
import fs from 'node:fs'
import path from 'node:path'
import { parse, type HTMLElement } from 'node-html-parser'

export const DIST = path.resolve(process.env.DIST_DIR ?? 'dist')

// Alle HTML-Seiten als Pfad der URL ('/' für die Startseite, '/impressum' für dist/impressum.html).
export function listDistPages(dir = DIST): string[] {
  const out: string[] = []
  const walk = (d: string): void => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name)
      if (e.isDirectory()) walk(full)
      else if (e.name.endsWith('.html')) {
        const rel = '/' + path.relative(dir, full).replace(/\\/g, '/').replace(/\.html$/, '')
        out.push(rel === '/index' ? '/' : rel.replace(/\/index$/, ''))
      }
    }
  }
  walk(dir)
  return out.sort()
}

export function distFile(page: string, dir = DIST): string {
  return path.join(dir, page === '/' ? 'index.html' : `${page}.html`)
}

export function readDist(page: string, dir = DIST): HTMLElement {
  return parse(fs.readFileSync(distFile(page, dir), 'utf8'))
}

export function readDistText(file: string, dir = DIST): string {
  return fs.readFileSync(path.join(dir, file), 'utf8')
}
