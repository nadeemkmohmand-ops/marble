// ─────────────────────────────────────────────────────────────────
// factory.js — the factory identity used on EVERY download.
// English mode prints "Almakka Factory", Urdu mode prints
// "المکہ فیکٹری" — on PDFs, Excel, Word, CSV, WhatsApp text and in
// the export filenames. If the owner typed a custom company name in
// Settings, that name wins (and is shown as-is in both languages).
// ─────────────────────────────────────────────────────────────────
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from './storage'

export const FACTORY_NAME = {
  en: 'Almakka Factory',
  ur: 'المکہ فیکٹری',
}

// Built-in placeholder names that should never be printed — the
// localized factory name is used instead.
const BUILTIN_NAMES = ['marble manager', 'marble factory', 'almakka factory', 'المکہ فیکٹری']

/** Localized factory name for documents & exports. */
export function getFactoryName(lang = 'en') {
  const company = storage.get(STORAGE_KEYS.COMPANY, null)
  const custom = String(company?.name || '').trim()
  if (custom && !BUILTIN_NAMES.includes(custom.toLowerCase())) return custom
  return lang === 'ur' ? FACTORY_NAME.ur : FACTORY_NAME.en
}

/** ASCII-safe factory tag for filenames (Urdu filenames confuse some phones). */
export function factoryFileTag() {
  const custom = String(storage.get(STORAGE_KEYS.COMPANY, null)?.name || '').trim()
  if (custom && !BUILTIN_NAMES.includes(custom.toLowerCase())) {
    const ascii = custom.replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    if (ascii) return ascii
  }
  return 'Almakka-Factory'
}

/** One shared "Company · Report · Date" head line for text exports. */
export function factoryHeadLine(title, lang = 'en') {
  const when = new Date().toLocaleDateString(lang === 'ur' ? 'ur-PK' : 'en-GB')
  return `${getFactoryName(lang)} — ${title} — ${when}`
}
