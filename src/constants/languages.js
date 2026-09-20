export const LANGUAGES = [
  { code: 'ur', name: 'اردو', english: 'Urdu', dir: 'rtl' },
  { code: 'en', name: 'English', english: 'English', dir: 'ltr' },
]

export const DEFAULT_LANGUAGE = 'ur'

export const RTL_LANGUAGES = ['ur']

export function isRtl(code) {
  return RTL_LANGUAGES.includes(code)
}
