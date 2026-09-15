/** Supported interface languages (Urdu is the primary, RTL language). */
export const DEFAULT_LANG = 'ur'

export const LANGUAGES = [
  { code: 'ur', dir: 'rtl', label: 'اردو', labelEn: 'Urdu' },
  { code: 'en', dir: 'ltr', label: 'English', labelEn: 'English' },
]

export const isSupportedLang = (code) => LANGUAGES.some((lang) => lang.code === code)

export const getLanguageMeta = (code) => LANGUAGES.find((lang) => lang.code === code) ?? LANGUAGES[0]
