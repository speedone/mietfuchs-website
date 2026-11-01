// Erzeugt public/og/default.png (1200 × 630), das Vorschaubild für geteilte Links.
// Einmalig bzw. bei Änderungen am Logo ausführen: node scripts/og-image.mjs
import fs from 'node:fs'
import { chromium } from 'playwright'

const logo = fs.readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')
const html = `<!doctype html><html><head><style>
  body { margin:0; width:1200px; height:630px; display:flex; align-items:center; gap:56px; padding:0 90px; box-sizing:border-box;
         font-family: 'Inter', 'Segoe UI', sans-serif; background: linear-gradient(135deg,#ffffff 0%,#eef0ff 100%); color:#0f1115; }
  .logo svg { width:220px; height:220px; filter: drop-shadow(0 18px 30px rgba(79,70,229,.3)); }
  h1 { font-size:68px; line-height:1.05; margin:0 0 18px; letter-spacing:-.02em; }
  p { font-size:32px; margin:0; color:#535866; }
  b { color:#c2410c; }
</style></head><body><div class="logo">${logo}</div>
<div><h1>Mietfuchs</h1><p>Nebenkostenabrechnung <b>kostenlos</b><br>für private Vermieter</p></div></body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html)
await page.screenshot({ path: new URL('../public/og/default.png', import.meta.url).pathname })
await browser.close()
console.log('public/og/default.png geschrieben')
