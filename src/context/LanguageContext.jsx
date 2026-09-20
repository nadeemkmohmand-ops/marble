import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import { DEFAULT_LANGUAGE, isRtl } from '../constants/languages'
import { translations } from '../i18n/translations'
import { fmtNumber, fmtCurrency, fmtDate, fmtDateTime, setFormatters } from '../utils/formatters'
import APP_CONFIG from '../config/app.config'

const LanguageContext = createContext(null)

// One-time migration: earlier builds defaulted Urdu (۰۱۲۳) digits to ON.
// If a device never made an explicit choice, force plain 0123 digits.
const URDU_DIGITS_MIGRATION_KEY = 'urduDigitsMigratedToLatinV1'
function getInitialUrduDigits() {
  const alreadyMigrated = storage.get(URDU_DIGITS_MIGRATION_KEY, false)
  if (!alreadyMigrated) {
    storage.set(URDU_DIGITS_MIGRATION_KEY, true)
    storage.set(STORAGE_KEYS.URDU_DIGITS, false)
    return false
  }
  return storage.get(STORAGE_KEYS.URDU_DIGITS, false)
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => storage.get(STORAGE_KEYS.LANG, DEFAULT_LANGUAGE))
  const [urduDigits, setUrduDigitsState] = useState(getInitialUrduDigits)

  useEffect(() => {
    storage.set(STORAGE_KEYS.LANG, lang)
    const root = document.documentElement
    root.lang = lang
    root.dir = isRtl(lang) ? 'rtl' : 'ltr'
  }, [lang])

  useEffect(() => {
    storage.set(STORAGE_KEYS.URDU_DIGITS, urduDigits)
  }, [urduDigits])

  // Publish locale to the pure formatter module so tables, exports
  // and print templates all stay consistent (Urdu digits, currency).
  useEffect(() => {
    const settings = storage.get(STORAGE_KEYS.SETTINGS, APP_CONFIG.defaults)
    setFormatters({
      lang,
      urduDigits: lang === 'ur' && urduDigits,
      currency: settings?.currency || APP_CONFIG.currency,
    })
  }, [lang, urduDigits])

  const value = useMemo(() => {
    const dir = isRtl(lang) ? 'rtl' : 'ltr'
    const fmtOpts = { lang, urduDigits: lang === 'ur' && urduDigits }
    return {
      lang,
      dir,
      isRTL: dir === 'rtl',
      urduDigits: urduDigits && lang === 'ur',
      setUrduDigits: setUrduDigitsState,
      setLang: setLangState,
      toggleLang: () => setLangState((l) => (l === 'ur' ? 'en' : 'ur')),
      t: (key, params) => translate(translations[lang], translations.en, key, params),
      fmtNum: (v, decimals) => fmtNumber(v, { ...fmtOpts, decimals }),
      fmtMoney: (v, currency) => fmtCurrency(v, { ...fmtOpts, currency: currency || undefined }),
      fmtDate: (v) => fmtDate(v, fmtOpts),
      fmtDateTime: (v) => fmtDateTime(v, fmtOpts),
    }
  }, [lang, urduDigits])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

/** Nested key lookup with {{param}} interpolation and English fallback. */
function translate(dict, fallbackDict, key, params) {
  let val = lookup(dict, key)
  if (val === undefined) val = lookup(fallbackDict, key)
  if (val === undefined) return key
  if (params && typeof val === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replaceAll(`{{${k}}}`, String(v))
    })
  }
  return val
}

function lookup(obj, path) {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj)
}

export function useLang() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLang must be used inside LanguageProvider')
  return ctx
}
