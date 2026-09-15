/**
 * Formatters — Urdu digits, numbers, currency, dates and percentages.
 * All helpers are pure (no React, no side effects).
 */

const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/** '2026' → '۲۰۲۶' */
export function toUrduDigits(value) {
  return String(value).replace(/[0-9]/g, (digit) => URDU_DIGITS[Number(digit)])
}

/** 1250000 → '1,250,000' (Urdu digits when lang === 'ur') */
export function formatNumber(value, lang = 'ur') {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  const grouped = new Intl.NumberFormat('en-US').format(n)
  return lang === 'ur' ? toUrduDigits(grouped) : grouped
}

/** 1250000 → '۱۲٬۵۰٬۰۰۰ روپے' | 'PKR 1,250,000' */
export function formatCurrency(value, lang = 'ur') {
  const amount = formatNumber(value, lang)
  return lang === 'ur' ? `${amount} روپے` : `PKR ${amount}`
}

/** Date → localized long date ('ur-PK' | 'en-GB') */
export function formatDate(value, lang = 'ur', options = {}) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  const defaults = { year: 'numeric', month: 'long', day: 'numeric' }
  return new Intl.DateTimeFormat(lang === 'ur' ? 'ur-PK' : 'en-GB', {
    ...defaults,
    ...options,
  }).format(date)
}

/** 8.5 → '۸.۵٪' | '8.5%' */
export function formatPercent(value, lang = 'ur') {
  const n = Number(value)
  if (!Number.isFinite(n)) return String(value)
  const s = `${n}%`
  return lang === 'ur' ? toUrduDigits(s) : s
}
