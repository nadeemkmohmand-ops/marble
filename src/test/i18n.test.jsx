import { describe, expect, it } from 'vitest'
import { translations } from '../i18n/index.js'

// Pure resolver mirroring the LanguageContext lookup behaviour
// (lang dictionary → English fallback → raw key).
function resolveKey(dict, path) {
  return String(path).split('.').reduce((node, k) => (node == null ? node : node[k]), dict)
}
function translate(lang, key, params) {
  const raw = resolveKey(translations[lang], key) ?? resolveKey(translations.en, key) ?? key
  if (typeof raw !== 'string') return key
  return params ? raw.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? `{{${k}}}`) : raw
}

describe('i18n engine', () => {
  it('resolves nested namespace keys', () => {
    expect(resolveKey({ a: { b: 'x' } }, 'a.b')).toBe('x')
    expect(translate('ur', 'nav.home')).toBe('ڈیش بورڈ')
    expect(translate('en', 'nav.home')).toBe('Dashboard')
  })

  it('interpolation leaves plain keys intact', () => {
    // keys without placeholders render as-is
    expect(translate('en', 'home.welcome')).toBe('Welcome')
    // unknown keys fall back to the raw key
    expect(translate('en', 'login.welcome')).toBe('login.welcome')
  })

  it('falls back to the raw key for unknown keys', () => {
    expect(translate('ur', 'does.not.exist')).toBe('does.not.exist')
    expect(translate('en', 'does.not.exist')).toBe('does.not.exist')
  })

  it('ships a complete Urdu mirror of the nav', () => {
    const enNav = Object.keys(translations.en.nav)
    const urNav = Object.keys(translations.ur.nav)
    expect(urNav.sort()).toEqual(enNav.sort())
  })
})
