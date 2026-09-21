import { num, round, toUrduDigits, toLatinDigits } from './numbers'

// ─────────────────────────────────────────────────────────────────
// formatters — locale aware display helpers.
// LanguageContext publishes the active locale via setFormatters(),
// so every call anywhere (tables, exports, print templates) is
// automatically consistent (Urdu digits, currency, etc.).
// ─────────────────────────────────────────────────────────────────

let currentFmt = { lang: 'en', urduDigits: false, currency: 'PKR' }

export function setFormatters(opts = {}) {
  currentFmt = { ...currentFmt, ...opts }
}

export function getFormatters() {
  return currentFmt
}

export function fmtNumber(value, opts = {}) {
  const o = { ...currentFmt, ...opts }
  const { lang = o.lang, urduDigits = o.urduDigits, decimals = 2 } = o
  const n = num(value)
  if (!Number.isFinite(n)) return urduDigits ? toUrduDigits('0') : '0'
  const str = n.toLocaleString(lang === 'ur' ? 'en-PK' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  })
  return urduDigits ? toUrduDigits(str) : str
}

export function fmtCurrency(value, opts = {}) {
  const o = { ...currentFmt, ...opts }
  const { currency = o.currency, lang = o.lang, urduDigits = o.urduDigits } = o
  const s = fmtNumber(value, o)
  const symbol = currency === 'PKR' ? 'Rs' : currency
  return lang === 'ur' ? `${s} ${urduCurrency(currency)}` : `${symbol} ${s}`
}

export function urduCurrency(currency) {
  return { PKR: 'روپے', USD: 'ڈالر', EUR: 'یورو', AED: 'درہم', CNY: 'یوان' }[currency] || currency
}

export function fmtDate(value, opts = {}) {
  if (!value) return '—'
  const { lang = 'en', urduDigits = false } = opts
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const str = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  return urduDigits ? toUrduDigits(str) : str
}

export function fmtDateTime(value, opts = {}) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const date = fmtDate(value, opts)
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  const s = `${date} ${time}`
  return opts.urduDigits ? toUrduDigits(s) : s
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

// ── Unit formatting ──
export function fmtUnit(value, unit, opts = {}) {
  return `${fmtNumber(value, opts)} ${unit}`
}

export function fmtSqft(value, opts = {}) {
  return `${fmtNumber(value, opts)} ${opts.lang === 'ur' ? 'sq ft' : 'sq ft'}`
}

export function fmtCft(value, opts = {}) {
  return `${fmtNumber(value, opts)} cft`
}

export function fmtKg(value, opts = {}) {
  return `${fmtNumber(value, opts)} kg`
}

export function fmtPhone(value) {
  const s = toLatinDigits(String(value || '')).replace(/[^\d+]/g, '')
  return s
}

// Bilingual label picker used by exports/print when i18n hook is unavailable
export function bi(en, ur, lang) {
  return lang === 'ur' ? ur : en
}

// ── Bidi safety (fixes ")in(" bracket mirroring) ──
// Inside RTL text, neutral characters (brackets, ×, dashes) around a
// Latin run get mirrored by the Unicode bidi algorithm — "L×W×H (in)"
// renders as ")in( L×W×H". Wrapping a purely-Latin run in Unicode
// ISOLATE marks (U+2066 … U+2069) freezes its LTR order everywhere:
// Excel, Word, CSV viewers and PDF text — no visual character added.
const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/
const LATINISH_RE = /[A-Za-z0-9([{"'°×\-]/

export function bidiSafe(value, rtl) {
  const s = value === null || value === undefined ? '' : String(value)
  if (!rtl || !s) return s
  if (ARABIC_RE.test(s)) return s // already RTL — leave untouched
  if (!LATINISH_RE.test(s)) return s
  return '\u2066' + s + '\u2069'
}

export { round, num }
