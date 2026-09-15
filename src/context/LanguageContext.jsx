import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { translate } from '../i18n/index.js'
import { DEFAULT_LANG, isSupportedLang } from '../constants/languages.js'
import { STORAGE_KEYS } from '../constants/storageKeys.js'
import { storageGet, storageSet } from '../utils/storage.js'

/**
 * LanguageContext — language state + i18n helpers (split out of the old
 * AppUIContext so each concern can grow independently).
 *
 *  - lang: 'ur' (default, RTL) | 'en' (LTR)  → persists to localStorage
 *  - t(key, params): translate helper with {{param}} interpolation
 *  - pick(entry): picks the current language from bilingual { ur, en } data
 */
const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = storageGet(STORAGE_KEYS.LANG, DEFAULT_LANG, { json: false })
    return isSupportedLang(saved) ? saved : DEFAULT_LANG
  })

  // Language → direction + font stack on <html>
  useEffect(() => {
    const root = document.documentElement
    root.lang = lang
    root.dir = lang === 'ur' ? 'rtl' : 'ltr'
    root.classList.toggle('lang-ur', lang === 'ur')
    root.classList.toggle('lang-en', lang === 'en')
    storageSet(STORAGE_KEYS.LANG, lang, { json: false })
  }, [lang])

  const t = useCallback((key, params) => translate(lang, key, params), [lang])

  const pick = useCallback(
    (entry) => (entry && typeof entry === 'object' ? entry[lang] ?? entry.ur : entry),
    [lang]
  )

  const value = useMemo(
    () => ({ lang, setLang, t, pick, isRTL: lang === 'ur' }),
    [lang, t, pick]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) {
    throw new Error('useLanguage must be used inside <LanguageProvider> (see context/index.jsx)')
  }
  return ctx
}
