/** Pure number helpers — clamp, coerce, round, sum. */

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/** Number('abc') → NaN; toNumber('abc', 0) → 0 */
export function toNumber(value, fallback = 0) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

export function roundTo(value, decimals = 0) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function isPositiveInteger(value) {
  const n = Number(value)
  return Number.isInteger(n) && n > 0
}

export function sum(values = []) {
  return values.reduce((acc, value) => acc + toNumber(value, 0), 0)
}
