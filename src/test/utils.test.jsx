import { describe, expect, it } from 'vitest'
import { cn } from '../utils/cn.js'
import { fmtNumber } from '../utils/formatters.js'
import { storage } from '../utils/storage.js'
import { clamp, num as toNumber, round, sum, toUrduDigits } from '../utils/numbers.js'
import { STORAGE_KEYS } from '../constants/storageKeys.js'

describe('utils', () => {
  it('cn joins conditional classes', () => {
    const show = true
    expect(cn('a', show && 'b', ['c', null], 'd')).toBe('a b c d')
    expect(cn('a', false, undefined, 'd')).toBe('a d')
  })

  it('formatters group numbers and support Urdu digits', () => {
    expect(fmtNumber(1250000, { lang: 'en' })).toBe('1,250,000')
    expect(fmtNumber(1250000, { lang: 'ur', urduDigits: true })).toBe('۱,۲۵۰,۰۰۰')
  })

  it('storage wrapper is safe and JSON-aware', () => {
    expect(storage.set('mfa-test-key', { a: 1 })).toBe(true)
    expect(storage.get('mfa-test-key')).toEqual({ a: 1 })
    expect(storage.get('mfa-missing', 'fallback')).toBe('fallback')
    expect(storage.set(STORAGE_KEYS.LANG, 'ur')).toBe(true)
    expect(storage.get(STORAGE_KEYS.LANG)).toBe('ur')
    storage.remove('mfa-test-key')
    expect(storage.get('mfa-test-key', null)).toBeNull()
  })

  it('number helpers clamp, coerce, round and sum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
    expect(toNumber('abc', 3)).toBe(3)
    expect(round(1.005, 2)).toBe(1.01)
    expect(sum([1, '2', 3])).toBe(6)
    expect(toUrduDigits('2026')).toBe('۲۰۲۶')
  })
})
