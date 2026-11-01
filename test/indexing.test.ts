import { describe, expect, it } from 'vitest'
import { isIndexable } from '../src/lib/indexing.ts'

describe('isIndexable', () => {
  it('ist ohne Angaben nicht indexierbar', () => {
    expect(isIndexable({})).toBe(false)
  })
  it('braucht neben dem Schalter auch die Impressumsadresse', () => {
    expect(isIndexable({ SITE_INDEXABLE: '1' })).toBe(false)
    expect(isIndexable({ SITE_INDEXABLE: '1', IMPRESSUM_ADDRESS: '  ' })).toBe(false)
  })
  it('ist mit Schalter und Adresse indexierbar', () => {
    expect(isIndexable({ SITE_INDEXABLE: '1', IMPRESSUM_ADDRESS: 'c/o X, Str. 1, 12345 Ort' })).toBe(true)
  })
  it('gibt mit „force“ ausdrücklich auch ohne Adresse frei', () => {
    expect(isIndexable({ SITE_INDEXABLE: 'force' })).toBe(true)
    expect(isIndexable({ SITE_INDEXABLE: 'force', IMPRESSUM_ADDRESS: 'c/o X' })).toBe(true)
  })
  it('braucht den Schalter auch, wenn die Adresse da ist', () => {
    expect(isIndexable({ IMPRESSUM_ADDRESS: 'c/o X' })).toBe(false)
  })
})
