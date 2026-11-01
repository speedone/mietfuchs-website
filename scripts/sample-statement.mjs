// Erzeugt public/downloads/beispiel-nebenkostenabrechnung.pdf: eine echte, mit Mietfuchs erstellte
// Abrechnung aus dem erfundenen Beispielbestand („Lindenweg 12, 12345 Musterstadt“).
// Braucht das Mietfuchs-Repo als Nachbarordner (../mietfuchs) mit gebauter Oberfläche (client/dist).
// startDemo setzt NKA_DATA_DIR (Wegwerf-Ordner), CI=1 und NKA_UPDATE_URL selbst (demo-stock.mjs).
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const mietfuchs = path.resolve(process.argv[2] ?? '../mietfuchs')
const { startDemo } = await import(pathToFileURL(path.join(mietfuchs, 'scripts/demo-stock.mjs')).href)
const out = path.resolve('public/downloads/beispiel-nebenkostenabrechnung.pdf')

const browser = await chromium.launch()
const pdfPage = await browser.newPage()
const demo = await startDemo({
  pdf: async (html) => {
    await pdfPage.setContent(html)
    return pdfPage.pdf({ format: 'A4' })
  },
})
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: 'light', locale: 'de-DE', timezoneId: 'Europe/Berlin' })
  await context.addInitScript(() => { try { localStorage.setItem('nka-theme', 'light') } catch { /* egal */ } })
  const page = await context.newPage()
  await page.goto(demo.base)
  await page.getByRole('button', { name: 'Cockpit' }).waitFor()
  await page.locator('nav.sidebar').getByRole('button', { name: 'Abrechnung' }).first().click()
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /^Ansehen/ }).first().click()
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(500)
  // Nur die Abrechnung dieses Mieters, wie beim Einzeldruck der App (index.css: body.print-one, .print-target)
  const ok = await page.evaluate(() => {
    const target = document.querySelector('.card.statement:not(.statement-hidden)')
    if (!target) return false
    document.body.classList.add('print-one')
    target.classList.add('print-target')
    return true
  })
  if (!ok) throw new Error('Keine Abrechnung auf der Seite gefunden')
  await page.emulateMedia({ media: 'print' })
  await page.pdf({ path: out, format: 'A4', printBackground: true })
  console.log(`${path.relative(process.cwd(), out)} geschrieben`)
} finally {
  await browser.close()
  await demo.stop()
}
