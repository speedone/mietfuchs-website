// Nach dem Bauen: Jeder Link auf eine fremde Seite öffnet in einem neuen Fenster, mit rel="noopener" und
// einem unsichtbaren Hinweis für Screenreader (WCAG-Technik G201). Gilt für alle Seiten, auch für Links in
// den Ratgebertexten (MDX). Eigene Adressen und /download/ (startet den Download) bleiben im selben Fenster.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'node-html-parser'

const OWN = 'https://mietfuchs-app.de'
const HINT = '<span class="visually-hidden"> (öffnet in neuem Fenster)</span>'

export function markExternalLinks(html) {
  const root = parse(html, { comment: true })
  let changed = false
  for (const a of root.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') ?? ''
    if (!/^https?:\/\//.test(href) || href.startsWith(OWN)) continue
    a.setAttribute('target', '_blank')
    const rel = new Set((a.getAttribute('rel') ?? '').split(/\s+/).filter(Boolean))
    rel.add('noopener')
    a.setAttribute('rel', [...rel].join(' '))
    if (!a.innerHTML.includes('neuem Fenster')) a.insertAdjacentHTML('beforeend', HINT)
    changed = true
  }
  return changed ? root.toString() : html
}

export default function externalLinks() {
  return {
    name: 'external-links',
    hooks: {
      'astro:build:done': ({ dir }) => {
        const walk = (d) => {
          for (const e of fs.readdirSync(d, { withFileTypes: true })) {
            const full = path.join(d, e.name)
            if (e.isDirectory()) walk(full)
            else if (e.name.endsWith('.html')) fs.writeFileSync(full, markExternalLinks(fs.readFileSync(full, 'utf8')))
          }
        }
        walk(fileURLToPath(dir))
      },
    },
  }
}
