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

// Die echten Antwortköpfe aus public/_headers (vor allem die CSP) gelten auch hier: astro preview liefert
// sie nicht aus, und ohne sie fiele nicht auf, wenn die CSP Skripte der Seite blockiert.
function headersFor(file) {
  const out = {}
  let active = false
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue
    if (!/^\s/.test(line)) { active = line.trim() === '/*'; continue }
    if (!active) continue
    const i = line.indexOf(':')
    out[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim()
  }
  return out
}
const siteHeaders = headersFor(path.resolve('public/_headers'))
if (!siteHeaders['content-security-policy']) throw new Error('public/_headers: keine CSP für /* gefunden')

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
  // Seiten parallel prüfen (vier gleichzeitig), sonst dauert der Lauf auf CI-Rechnern sehr lange.
  const checkPage = async (page) => {
    for (const [w, h] of [[390, 844], [768, 1024], [1440, 900]]) {
      for (const scheme of ['light', 'dark']) {
        const label = `${page} ${w}px ${scheme}`
        const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: scheme })
        await ctx.route(`http://localhost:${port}/**`, async (route) => {
          const res = await route.fetch()
          await route.fulfill({ response: res, headers: { ...res.headers(), ...siteHeaders } })
        })
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
  const queue = pages()
  await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await checkPage(queue.shift()) }))
  // Funktionsprobe mit CSP: Unter Windows muss der Hauptknopf auf /download/windows zeigen.
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' })
  await ctx.route(`http://localhost:${port}/**`, async (route) => {
    const res = await route.fetch()
    await route.fulfill({ response: res, headers: { ...res.headers(), ...siteHeaders } })
  })
  const tab = await ctx.newPage()
  await tab.goto(`http://localhost:${port}/`, { waitUntil: 'networkidle' })
  const href = await tab.locator('[data-section=hero] [data-cta=primary]').getAttribute('href')
  if (href !== '/download/windows') problems.push(`Download-Knopf unter Windows zeigt auf ${href} statt /download/windows (Skript blockiert?)`)
  await ctx.close()
} finally {
  await browser.close()
  preview.kill()
}

if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log('Seitenprüfung ohne Befund')
