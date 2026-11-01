import { describe, expect, it } from 'vitest'
import { DONATE_URL, REPO_URL } from '../../src/lib/site.ts'
import { readDist } from '../helpers/dist.ts'

describe('/herunterladen', () => {
  const doc = readDist('/herunterladen')
  it('hat Abschnitte für jedes System, Docker und das Handy', () => {
    for (const id of ['windows', 'macos', 'linux', 'docker', 'handy']) expect(doc.querySelector(`#${id}`), id).not.toBeNull()
  })
  it('führt jeden Download über die eigene Weiterleitung', () => {
    for (const p of ['windows', 'windows-exe', 'windows-arm', 'macos', 'macos-intel', 'linux', 'linux-arm']) {
      expect(doc.querySelector(`a[href="/download/${p}"]`), p).not.toBeNull()
    }
  })
  it('zeigt das Store-Badge als eigene Datei', () => {
    const badge = doc.querySelector('#windows img[src^="/badges/"]')
    expect(badge?.getAttribute('alt')).toMatch(/Microsoft Store/)
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
})

describe('/ueber', () => {
  const doc = readDist('/ueber')
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
