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
