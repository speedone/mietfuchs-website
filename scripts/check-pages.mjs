// Prüft jede gebaute Seite in Chromium: 390 × 844 und 1440 × 900, hell und dunkel. Je Seite axe ohne
// serious/critical, kein seitliches Scrollen, keine Konsolenfehler. Vorher `npm run build`.
// Mit --shots <ordner> legt es Bildschirmfotos ab (zum Ansehen, nicht fürs Repo).
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { chromium } from 'playwright'
import { AxeBuilder } from '@axe-core/playwright'

const dist = path.resolve('dist')
const shotsArg = process.argv.indexOf('--shots')
const shots = shotsArg > 0 ? path.resolve(process.argv[shotsArg + 1]) : null
if (shots) fs.mkdirSync(shots, { recursive: true })

function pages(dir = dist) {
  const out = []
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) out.push(...pages(full))
    else if (e.name.endsWith('.html')) {
      const rel = '/' + path.relative(dist, full).replace(/\\/g, '/').replace(/\.html$/, '')
      out.push(rel === '/index' ? '/' : rel)
    }
  }
  return out.sort()
}

const port = 4399
const preview = spawn('npx', ['astro', 'preview', '--port', String(port)], { stdio: ['ignore', 'pipe', 'inherit'] })
await new Promise((resolve, reject) => {
  preview.stdout.on('data', (d) => { if (String(d).includes(String(port))) resolve(undefined) })
  preview.on('exit', () => reject(new Error('astro preview beendet')))
  setTimeout(() => reject(new Error('astro preview startet nicht')), 30000)
})

const problems = []
const browser = await chromium.launch()
try {
  for (const page of pages()) {
    for (const [w, h] of [[390, 844], [1440, 900]]) {
      for (const scheme of ['light', 'dark']) {
        const label = `${page} ${w}px ${scheme}`
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })
        const tab = await ctx.newPage()
        const errors = []
        tab.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
        tab.on('pageerror', (e) => errors.push(String(e)))
        await tab.goto(`http://localhost:${port}${page === '/' ? '/' : page}`, { waitUntil: 'networkidle' })
        const overflow = await tab.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
        if (overflow > 0) problems.push(`${label}: seitliches Scrollen (${overflow} px)`)
        for (const e of errors) problems.push(`${label}: Konsole: ${e}`)
        const axe = await new AxeBuilder({ page: tab }).analyze()
        for (const v of axe.violations.filter((v) => ['serious', 'critical'].includes(v.impact ?? ''))) {
          problems.push(`${label}: axe ${v.id} (${v.nodes.length}×): ${v.nodes[0]?.target.join(' ')}`)
        }
        if (shots) await tab.screenshot({ path: path.join(shots, `${page === '/' ? 'start' : page.slice(1).replace(/\//g, '_')}-${w}-${scheme}.png`), fullPage: true })
        await ctx.close()
      }
    }
  }
} finally {
  await browser.close()
  preview.kill()
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('Seitenprüfung ohne Befund')
