import { describe, expect, it } from 'vitest'
import { impressumAddress } from '../src/lib/legal.ts'

describe('impressumAddress', () => {
  it('liefert die Adresse ohne Leerraum und null, wenn sie fehlt', () => {
    expect(impressumAddress({ IMPRESSUM_ADDRESS: '  c/o Test, Teststr. 1, 12345 Teststadt ' })).toBe('c/o Test, Teststr. 1, 12345 Teststadt')
    expect(impressumAddress({ IMPRESSUM_ADDRESS: '   ' })).toBeNull()
    expect(impressumAddress({})).toBeNull()
  })
})
