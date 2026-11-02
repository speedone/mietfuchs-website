import { describe, expect, it } from 'vitest'
import { APP_VERSION, DONATE_URL, REPO_URL } from '../../src/lib/site.ts'
import { listDistPages, readDist } from '../helpers/dist.ts'

describe('/herunterladen', () => {
  const doc = readDist('/herunterladen')
  it('hat Abschnitte für jedes System, Docker und das Handy', () => {
    for (const id of ['windows', 'macos', 'umstieg', 'linux', 'docker', 'handy', 'updates', 'daten', 'pruefen']) expect(doc.querySelector(`#${id}`), id).not.toBeNull()
  })
  it('führt jeden Download über die eigene Weiterleitung', () => {
    for (const p of ['windows', 'windows-exe', 'macos', 'macos-intel', 'linux', 'linux-arm']) {
      expect(doc.querySelector(`a[href="/download/${p}"]`), p).not.toBeNull()
    }
  })
  it('führt im Windows-Abschnitt mit einem Knopf im Stil der Seite in den Store', () => {
    expect(doc.querySelector('#windows a.btn-primary[href="/download/windows"]')).not.toBeNull()
    expect(doc.querySelector('#windows img')).toBeNull()
  })
  it('zeigt vier Karten mit kurzem Knopf, Detailzeile und zweiter Wahl; das Etikett erst mit Systemerkennung', () => {
    const cards = doc.querySelectorAll('.platforms > li')
    expect(cards.map((c) => c.getAttribute('data-platform'))).toEqual(['windows', 'macos', 'linux', 'docker'])
    expect(cards.map((c) => c.querySelector('.cta .btn')?.text.trim())).toEqual(['Microsoft Store', 'Für Mac laden', 'Für Linux laden', 'Docker-Anleitung'])
    for (const c of cards) {
      expect(c.querySelector('.cta .detail')?.text.trim(), c.getAttribute('data-platform') ?? '').not.toBe('')
      expect(c.querySelector('.cta .alt-link'), c.getAttribute('data-platform') ?? '').not.toBeNull()
    }
    expect(doc.querySelector('[data-platform="macos"] .detail')?.text).toContain(`Mietfuchs-${APP_VERSION}-apple-silicon.dmg`)
    expect(doc.querySelector('[data-platform="macos"] .alt-link')?.getAttribute('href')).toBe('/download/macos-intel')
    expect(doc.querySelector('[data-platform="windows"] .alt-link')?.getAttribute('href')).toBe('#installer')
    expect(doc.querySelector('#installer')).not.toBeNull()
    for (const y of doc.querySelectorAll('[data-yours]')) expect(y.hasAttribute('hidden')).toBe(true)
  })
  it('zeigt auf jeder Karte das Systemlogo als eingebettetes, einfarbiges SVG', () => {
    for (const c of doc.querySelectorAll('.platforms > li')) {
      const svg = c.querySelector('.ic svg.brand-icon')
      expect(svg, c.getAttribute('data-platform') ?? '').not.toBeNull()
      expect(svg?.getAttribute('aria-hidden')).toBe('true')
      expect(svg?.innerHTML).toContain('fill="currentColor"')
    }
  })
  it('erklärt Docker und den Weg am Handy', () => {
    expect(doc.querySelector('#docker')?.text).toContain('docker compose up -d')
    expect(doc.querySelector('#handy')?.text).toMatch(/Computer/)
  })
})

describe('/herunterladen: Was ist neu', () => {
  it('nennt Version und Datum und verlinkt alle Änderungen', () => {
    const neu = readDist('/herunterladen').querySelector('#neu')
    expect(neu?.text).toMatch(/Version \d+\.\d+\.\d+/)
    expect(neu?.querySelector('a[href="https://github.com/speedone/mietfuchs/releases"]')).not.toBeNull()
  })
})

describe('/herunterladen: Daten und Anleitungen', () => {
  const doc = readDist('/herunterladen')
  it('nennt je System den Datenordner und die Sicherung', () => {
    const t = doc.querySelector('#daten')?.text ?? ''
    for (const s of ['%USERPROFILE%', 'Application Support', '.local/share/mietfuchs', 'mietfuchs-data', 'Backup']) expect(t, s).toContain(s)
  })
  it('führt macOS in nummerierten Schritten', () => {
    expect(doc.querySelectorAll('#macos ol li').length).toBeGreaterThanOrEqual(3)
  })
  it('nennt Installer und Mac-Abbilder mit Version (ohne Netz: APP_VERSION) und die Freigaben beim ersten Start', () => {
    expect(doc.querySelector('a[href="/download/windows-exe"]:not(.btn)')?.text).toBe(`Mietfuchs-Setup-${APP_VERSION}.exe`)
    expect(doc.querySelector('#macos a[href="/download/macos"]:not(.btn)')?.text).toBe(`Mietfuchs-${APP_VERSION}-apple-silicon.dmg`)
    expect(doc.querySelector('#macos a[href="/download/macos-intel"]')?.text).toBe(`Mietfuchs-${APP_VERSION}-intel.dmg`)
    expect(doc.querySelector('#windows')?.text).toContain('Trotzdem ausführen')
    expect(doc.querySelector('#macos')?.text).toContain('Dennoch öffnen')
    expect(doc.querySelector('#macos')?.text).toContain('macOS 13')
  })
  it('erklärt den Zugriff vom Handy mit dem neuen Port', () => {
    const t = doc.querySelector('#handy')?.text ?? ''
    for (const s of ['Zugriff aus dem Heimnetz', '17517', 'Lesezeichen']) expect(t, s).toContain(s)
  })
  it('zeigt das Prüfen des Downloads aufklappbar und ohne feste Prüfsummen', () => {
    const details = doc.querySelector('#pruefen details')
    expect(details?.querySelector('summary')?.text).toContain('Echtheit prüfen')
    const t = details?.text ?? ''
    for (const s of ['SHA256SUMS.txt', 'Get-FileHash', 'shasum -a 256', 'gh attestation verify', '-R speedone/mietfuchs']) expect(t, s).toContain(s)
    expect(t).not.toMatch(/\b[0-9a-f]{64}\b/)
    expect(t).toContain(`Downloads\\Mietfuchs-Setup-${APP_VERSION}.exe`)
  })
})

describe('/herunterladen: Store-Hinweis zum Umstieg', () => {
  // Vorübergehend: nach Store-Freigabe 0.15 mit dem Absatz in herunterladen.astro entfernen.
  it('rät beim Umstieg zum Installer, solange der Store 0.15 noch nicht ausliefert', () => {
    const t = readDist('/herunterladen').querySelector('#umstieg [data-store-delay]')?.text ?? ''
    expect(t).toContain('Bis der Microsoft Store Version 0.15 ausliefert')
    expect(t).toContain('Installer')
  })
})

describe('/ueber', () => {
  const doc = readDist('/ueber')
  it('nennt Font Awesome mit Lizenz und die Marken der Systeme', () => {
    expect(doc.querySelector('a[href="https://fontawesome.com/license/free"]')?.text).toContain('CC BY 4.0')
    const t = doc.querySelector('main')?.text ?? ''
    for (const s of ['Apple', 'macOS', 'Linus Torvalds', 'Docker, Inc.', 'Windows']) expect(t, s).toContain(s)
  })
  it('verlinkt Spenden als freiwillig und das Repo', () => {
    const donate = doc.querySelector(`a[href="${DONATE_URL}"]`)
    expect(donate?.getAttribute('rel')).toContain('noopener')
    expect(doc.querySelector('main')?.text).toMatch(/freiwillig/)
    expect(doc.querySelector(`main a[href="${REPO_URL}"]`)).not.toBeNull()
  })
})

describe('/funktionen', () => {
  it('ordnet die Funktionen in Gruppen mit je einer Karte pro Funktion', () => {
    const doc = readDist('/funktionen')
    expect(doc.querySelectorAll('main section h2').length).toBeGreaterThanOrEqual(3)
    expect(doc.querySelectorAll('main .cards h3').length).toBeGreaterThanOrEqual(12)
  })

  it('nennt auch die Funktionen jenseits der README-Highlights', () => {
    const text = readDist('/funktionen').querySelector('main')?.text ?? ''
    for (const s of ['DIN 5008', '§ 560 Abs. 4 BGB', 'Bundesland', 'Pauschale', 'Warmmiete', 'Monatliche Verbrauchsinformation', 'Gradtag',
      'Contracting', '§ 82b EStDV', '§ 21 Abs. 2 EStG', 'Erhaltungsrücklage', 'Verlauf', 'Rückgängig', 'Papierkorb', 'Vorversion', 'CSV']) {
      expect(text, s).toContain(s)
    }
  })
})

describe('Links ins README von Mietfuchs', () => {
  // Das README wird umgebaut; nur diese Sprungmarken bleiben gültig.
  const keep = ['installation-unter-windows-und-macos', 'macos', 'mit-docker', 'zugriff-vom-handy-oder-einem-zweiten-rechner', 'download-prüfen-für-fortgeschrittene', 'ki-belegauswertung']
  it.each(listDistPages())('%s: nur Sprungmarken, die bleiben', (page) => {
    for (const a of readDist(page).querySelectorAll(`a[href^="${REPO_URL}#"]`)) {
      const href = a.getAttribute('href') ?? ''
      expect(keep, href).toContain(decodeURIComponent(href.split('#')[1] ?? ''))
    }
  })
})
