// Number safety helpers — every calculation in the app goes through these.

export function num(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback
  const n = typeof value === 'number' ? value : parseFloat(toLatinDigits(String(value)))
  return Number.isFinite(n) ? n : fallback
}

export function round(value, decimals = 2) {
  const f = 10 ** decimals
  return Math.round((num(value) + Number.EPSILON) * f) / f
}

export function sum(list, getter = (x) => x) {
  return list.reduce((acc, item) => acc + num(getter(item)), 0)
}

export function clamp(value, min, max) {
  return Math.min(Math.max(num(value), min), max)
}

export function pct(value, total) {
  return total ? round((num(value) / num(total)) * 100, 1) : 0
}

// Urdu digits ↔ Latin digits
export const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

export function toUrduDigits(input) {
  return String(input ?? '').replace(/[0-9]/g, (d) => URDU_DIGITS[+d])
}

export function toLatinDigits(input) {
  return String(input ?? '')
    .replace(/[۰-۹]/g, (d) => String(URDU_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
}
