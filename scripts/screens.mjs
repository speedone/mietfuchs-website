// Erzeugt die Bildschirmfotos der Startseite (src/assets/screens/) aus dem erfundenen Beispielbestand von
// Mietfuchs („Lindenweg 12, 12345 Musterstadt“), jedes in hell und dunkel, dazu das gedruckte Blatt.
// Nach jedem Release mit sichtbaren Änderungen neu ausführen:
//
//   node scripts/screens.mjs [pfad-zu-mietfuchs]     # Vorgabe ../mietfuchs, mit gebauter Oberfläche (client/dist)
//
// Fotografiert wird der Stand des angegebenen Ordners; für die Website gehört dorthin die veröffentlichte Version.
// Jedes Bild ist ein gezielter Ausschnitt statt des ganzen Fensters, damit man auf der Seite etwas erkennt.
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'

const mietfuchs = path.resolve(process.argv[2] ?? '../mietfuchs')
const only = process.argv[3]
const { startDemo } = await import(pathToFileURL(path.join(mietfuchs, 'scripts/demo-stock.mjs')).href)
const out = path.resolve('src/assets/screens')
fs.mkdirSync(out, { recursive: true })

// Schmaler als ein üblicher Bildschirm: Die Bilder stehen auf der Seite verkleinert, so bleibt die Schrift lesbar.
const VIEWPORT = { width: 1180, height: 800 }
const SCALE = 2
const THEMES = ['light', 'dark']

const browser = await chromium.launch({ args: ['--lang=de-DE'], env: { ...process.env, LANG: 'de_DE.UTF-8' } })
const printer = await browser.newPage()
const demo = await startDemo({ pdf: async (html) => { await printer.setContent(html); return printer.pdf({ format: 'A4' }) } })

// Die Angaben zum Haus für den Kopf der Anlage V (erfunden wie der ganze Bestand): Ohne sie stünde in der
// Steuerübersicht fünfmal „nicht eingetragen“, und das Bild zeigte Lücken statt der Übersicht.
const [house] = await demo.api.get('/api/properties')
await demo.api.put(`/api/properties/${house.id}`, {
  ...house, groundTaxFileNumber: '1234567890123', purchaseContractOn: '2011-03-14', ownershipTransferOn: '2011-05-01',
  buildingApplicationOn: '1996-02-12', completedOn: '1997-08-29',
})

async function open(theme, viewport = VIEWPORT) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: SCALE, colorScheme: theme, locale: 'de-DE', timezoneId: 'Europe/Berlin' })
  await context.addInitScript((t) => { try { localStorage.setItem('nka-theme', t) } catch { /* dann gilt colorScheme */ } }, theme)
  const page = await context.newPage()
  await page.goto(demo.base)
  await page.getByRole('button', { name: 'Cockpit' }).waitFor()
  return page
}
const settle = async (page) => { await page.waitForLoadState('networkidle'); await page.waitForTimeout(400) }
const go = async (page, label) => {
  await page.locator('nav.sidebar').getByRole('button', { name: label }).first().click()
  await settle(page)
}
// Lage eines Elements im Dokument (nicht im Fenster), für Ausschnitte über die ganze Seite
const box = (locator) => locator.first().evaluate((el) => {
  const r = el.getBoundingClientRect()
  return { x: r.left + scrollX, y: r.top + scrollY, width: r.width, height: r.height }
})
const save = async (page, name, theme, clip) => {
  if (await page.locator('.error, [role="alert"].error').count()) throw new Error(`${name}: Fehlermeldung im Bild`)
  const file = path.join(out, theme ? `${name}-${theme}.png` : `${name}.png`)
  await page.screenshot({ path: file, fullPage: true, ...(clip ? { clip } : {}) })
  console.log(`✓ ${path.relative(process.cwd(), file)} (${Math.round(fs.statSync(file).size / 1024)} KB)`)
}
// Ausschnitt in der Breite des Inhalts (ohne Seitenleiste), ab der Oberkante von `from` mit etwas Luft, im Format 16:10
const RATIO = 0.625
const content = async (page, from, gap = 20) => {
  const main = await box(page.locator('main'))
  const top = (await box(from)).y - gap
  return { x: main.x, y: top, width: main.width, height: Math.round(main.width * RATIO) }
}
const preview = async (page) => {
  await go(page, 'Abrechnung')
  await page.getByRole('button', { name: /^Ansehen/ }).first().click()
  await settle(page)
}

const SHOTS = {
  // Das Programmfenster für den Blickfang: die Vorschau der Abrechnung mit Anschreiben
  window: async (page) => {
    await preview(page)
    return { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height }
  },
  // Station 1: der Belegordner mit einem Register je Kostenart (die ersten drei, jedes mit seinem Beleg)
  receipts: async (page) => {
    await go(page, 'Belege')
    await page.getByRole('tab', { name: 'Ordner' }).click()
    await settle(page)
    // Die Vorschaubilder der Belege entstehen im Browser und brauchen einen Moment
    await page.waitForFunction(() => [...document.querySelectorAll('.receipt-thumb img')].filter((i) => i.complete && i.naturalWidth > 0).length >= 3, undefined, { timeout: 30000 })
    return content(page, page.getByText('Beleg vorhanden').first(), 44)
  },
  // Station 2: die Kostenpositionen mit Umlageschlüssel und Beleg
  costs: async (page) => {
    await go(page, 'Kosten')
    return content(page, page.getByRole('heading', { name: /^Kostenpositionen/ }))
  },
  // Station 3: die Abrechnung eines Mieters mit aufgeklapptem Rechenweg
  statement: async (page) => {
    await preview(page)
    await page.getByRole('checkbox', { name: 'Rechenweg zeigen' }).check()
    await settle(page)
    return content(page, page.locator('.card.statement:not(.statement-hidden)').getByText('Ihre Kosten', { exact: true }), 30)
  },
  // Station 4: das Mietkonto eines Mietverhältnisses mit einem offenen Monat, darunter die Zahlungseingänge
  ledger: async (page) => {
    await go(page, 'Mietkonto')
    return content(page, page.getByText('Familie Yilmaz').first(), 36)
  },
  // Station 5: die Jahresübersicht für die Anlage V
  tax: async (page) => {
    await go(page, 'Steuer (Anlage V)')
    return content(page, page.getByText(/^Einnahmen \d{4}$/).first(), 70)
  },
}

// Das gedruckte Blatt: die Aufstellung, wie sie beim Einzeldruck der App aufs Papier kommt (index.css: body.print-one,
// .print-target), von der Überschrift bis zum Ergebnis. Papier ist weiß, deshalb nur einmal.
async function paper() {
  const page = await open('light')
  await preview(page)
  // Erst jetzt schmal wie ein Blatt: Im schmalen Fenster klappt die Seitenleiste ein
  await page.setViewportSize({ width: 720, height: 1000 })
  await page.evaluate(() => {
    document.body.classList.add('print-one')
    document.querySelector('.card.statement:not(.statement-hidden)')?.classList.add('print-target')
  })
  await page.emulateMedia({ media: 'print' })
  await page.waitForTimeout(300)
  const sheet = page.locator('.print-target')
  const head = await box(sheet.getByText(/^Nebenkostenabrechnung \d{4}$/))
  const end = await box(sheet.getByText('Nachzahlung zu Ihren Lasten').or(sheet.getByText('Guthaben zu Ihren Gunsten')).locator('xpath=ancestor::tr[1]'))
  const all = await box(sheet)
  await save(page, 'paper', '', { x: all.x, y: head.y, width: all.width, height: end.y + end.height - head.y })
  await page.context().close()
}

try {
  if (!only || only === 'paper') await paper()
  for (const theme of THEMES) {
    for (const [name, prepare] of Object.entries(SHOTS)) {
      if (only && only !== name) continue
      const page = await open(theme)
      const clip = await prepare(page)
      await save(page, name, theme, clip)
      if (theme === 'light' && process.env.DEBUG_DOM) console.log(await page.evaluate(() => { const h = document.querySelector('h1'); const a = []; for (let e = h; e; e = e.parentElement) a.push(`${e.tagName}.${e.className}`); return a.join(' < ') }))
      await page.context().close()
    }
  }
} finally {
  await browser.close()
  await demo.stop()
}
