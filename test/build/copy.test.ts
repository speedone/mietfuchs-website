import { describe, expect, it } from 'vitest'
import { findCopyViolations } from '../../src/lib/copy-rules.ts'
import { listDistPages, readDist } from '../helpers/dist.ts'

describe('Texte jeder Seite', () => {
  it.each(listDistPages())('%s: Sie-Anrede, kein Geviertstrich, keine Überversprechen', (page) => {
    const doc = readDist(page)
    for (const el of doc.querySelectorAll('script, style, code, pre')) el.remove()
    const text = [doc.querySelector('body')?.text ?? '', doc.querySelector('title')?.text ?? '',
      doc.querySelector('meta[name=description]')?.getAttribute('content') ?? ''].join('\n')
    expect(findCopyViolations(text)).toEqual([])
  })
})

describe('Leerzeichen um Links', () => {
  // Astro streicht den Zeilenumbruch zwischen Text und einem Link in der nächsten Zeile; dann klebt
  // „für ARM“ am Linktext („ARMmietfuchs-win-arm64.exe“).
  it.each(listDistPages())('%s: kein Wort klebt an einem Link', (page) => {
    const html = readDist(page).querySelector('body')?.innerHTML ?? ''
    const glued = [...html.matchAll(/[\p{L}\d]<a\s|<\/a>[\p{L}\d]/gu)].map((m) => html.slice(Math.max(0, m.index - 30), m.index + 30))
    expect(glued).toEqual([])
  })
})
