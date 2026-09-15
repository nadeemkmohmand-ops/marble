import { describe, expect, it } from 'vitest'
import { cn } from '../utils/cn.js'
import { toUrduDigits, formatNumber, formatPercent } from '../utils/formatters.js'
import { storageGet, storageSet, storageRemove } from '../utils/storage.js'
import { clamp, toNumber, roundTo, sum } from '../utils/numbers.js'
import { STORAGE_KEYS, storageKey } from '../constants/storageKeys.js'

describe('utils', () => {
  it('cn joins conditional classes', () => {
    const show = true
    expect(cn('a', show && 'b', ['c', null], 'd')).toBe('a b c d')
    expect(cn('a', false, undefined, 'd')).toBe('a d')
  })

  it('formatters produce Urdu digits and grouped numbers', () => {
    expect(toUrduDigits('2026')).toBe('۲۰۲۶')
    expect(formatNumber(1250000, 'en')).toBe('1,250,000')
    expect(formatNumber(1250000, 'ur')).toBe('۱,۲۵۰,۰۰۰')
    expect(formatPercent(8.5, 'ur')).toBe('۸.۵%')
  })

  it('storage wrapper is safe and JSON-aware', () => {
    expect(storageSet('mfa-test-key', { a: 1 })).toBe(true)
    expect(storageGet('mfa-test-key')).toEqual({ a: 1 })
    expect(storageGet('mfa-missing', 'fallback')).toBe('fallback')
    expect(storageSet(STORAGE_KEYS.LANG, 'ur', { json: false })).toBe(true)
    expect(storageGet(STORAGE_KEYS.LANG, '', { json: false })).toBe('ur')
    expect(storageRemove('mfa-test-key')).toBe(true)
    expect(storageKey('draft')).toBe('mfa-draft')
  })

  it('number helpers clamp, coerce, round and sum', () => {
    expect(clamp(15, 0, 10)).toBe(10)
    expect(toNumber('abc', 3)).toBe(3)
    expect(roundTo(1.005, 2)).toBe(1)
    expect(sum([1, '2', 3])).toBe(6)
  })
})
