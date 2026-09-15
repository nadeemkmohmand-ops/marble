import ur from './locales/ur.js'
import en from './locales/en.js'

/**
 * i18n engine — nested namespaces, interpolation and plurals.
 *
 *   t('inv.searchPlaceholder')              → dotted key lookup (ur → en → key)
 *   t('login.welcome', { name: 'Akram' })   → {{name}} interpolation
 *   t('cart.items', { count: 3 })           → `cart.items_one` / `cart.items_other`
 */
export const dictionaries = { ur, en }
export const SUPPORTED_LANGS = ['ur', 'en']

/** Walks a dotted key path ('inv.searchPlaceholder') through a nested dictionary. */
export function resolveKey(dict, key) {
  if (!dict || !key) return undefined
  if (!key.includes('.')) return dict[key]
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dict)
}

/** Replaces {{name}} placeholders: interpolate('Hi {{name}}', { name: 'Ali' }) → 'Hi Ali' */
export function interpolate(template, params = {}) {
  return String(template).replace(/{{\s*(\w+)\s*}}/g, (match, name) =>
    params[name] !== undefined && params[name] !== null ? String(params[name]) : match
  )
}

/**
 * translate(lang, key, params)
 * Fallback order: requested language → English → the raw key.
 * Plurals (documented convention): when params.count is set, try
 * `key_one` (count === 1) or `key_other` before the plain key.
 */
export function translate(lang, key, params = {}) {
  const dict = dictionaries[lang] ?? dictionaries.ur
  const candidates = [key]
  if (params && typeof params.count === 'number') {
    candidates.unshift(`${key}_${params.count === 1 ? 'one' : 'other'}`)
  }

  for (const candidate of candidates) {
    const entry = resolveKey(dict, candidate) ?? resolveKey(dictionaries.en, candidate)
    if (entry !== undefined) {
      if (typeof entry === 'object') return candidate // namespace hit, not a leaf
      return interpolate(entry, params)
    }
  }
  return key
}

/**
 * toLegacyTranslations — flattens the nested dictionaries back into the old
 * { 'ns.key': { ur, en } } shape. Only used by the deprecated
 * src/i18n/translations.js compatibility shim.
 */
export function toLegacyTranslations() {
  const flat = {}
  const collect = (prefix, dict, field) => {
    Object.entries(dict).forEach(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        collect(path, value, field)
      } else {
        flat[path] = flat[path] || { ur: undefined, en: undefined }
        flat[path][field] = value
      }
    })
  }
  collect('', dictionaries.ur, 'ur')
  collect('', dictionaries.en, 'en')
  return flat
}
