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
  it('hat je Funktion eine Zwischenüberschrift', () => {
    expect(readDist('/funktionen').querySelectorAll('main h2').length).toBeGreaterThanOrEqual(8)
  })
})
