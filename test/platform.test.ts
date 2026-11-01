import { describe, expect, it } from 'vitest'
import { detectPlatform } from '../src/lib/platform.ts'

const UA = {
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Safari/605.1.15',
  ubuntuFirefox: 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:143.0) Gecko/20100101 Firefox/143.0',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/19.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Mobile Safari/537.36',
  androidTablet: 'Mozilla/5.0 (Linux; Android 15; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
  chromeos: 'Mozilla/5.0 (X11; CrOS x86_64 16000.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36',
}

describe('detectPlatform', () => {
  it('erkennt die Desktop-Systeme', () => {
    expect(detectPlatform(UA.winChrome)).toBe('windows')
    expect(detectPlatform(UA.macSafari)).toBe('macos')
    expect(detectPlatform(UA.ubuntuFirefox)).toBe('linux')
  })
  it('erkennt Windows auf ARM über die Client Hints', () => {
    expect(detectPlatform('Mozilla/5.0 (Windows NT 10.0; ARM64)', 'Windows')).toBe('windows')
  })
  it('bietet Handys und Tablets keinen Desktop-Download an', () => {
    expect(detectPlatform(UA.iphone)).toBe('mobile')
    expect(detectPlatform(UA.android)).toBe('mobile')
    expect(detectPlatform(UA.androidTablet)).toBe('mobile')
    expect(detectPlatform(UA.macSafari, 'iOS')).toBe('mobile')
    expect(detectPlatform(UA.macSafari, undefined, 5)).toBe('mobile') // iPad gibt sich als Mac aus
  })
  it('bleibt bei Unbekanntem neutral', () => {
    expect(detectPlatform(UA.chromeos)).toBe('unknown')
    expect(detectPlatform('')).toBe('unknown')
  })
})
