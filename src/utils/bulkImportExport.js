// ─────────────────────────────────────────────────────────────────
// bulkImportExport.js — "download a template, fill rows, upload it
// back" for every CrudPage tab. The template's header row matches
// the tab's real editable fields (same order the Add form uses),
// with one filled-in example row so people can see the expected
// shape. Uploading re-parses those same headers back into records.
// ─────────────────────────────────────────────────────────────────
import * as XLSX from 'xlsx'
import { db } from '../services/db'
import { translations } from '../i18n/translations'

const IMPORTABLE_TYPES = new Set([undefined, 'text', 'number', 'date', 'tel', 'select', 'textarea', 'checkbox', 'ref'])

/** Standalone translator for a specific language — no React context needed here. */
function tFor(lang) {
  return (key, params) => {
    let val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), translations[lang])
    if (val === undefined) val = key.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), translations.en)
    if (val === undefined) return key
    if (params && typeof val === 'string') {
      Object.entries(params).forEach(([k, v]) => { val = val.replaceAll(`{{${k}}}`, String(v)) })
    }
    return val
  }
}

/** Fields worth putting in a spreadsheet — skips readonly/photo/custom (computed, binary, or bespoke UI). */
export function importableFields(config) {
  return (config.fields || []).filter((f) => IMPORTABLE_TYPES.has(f.type))
}

function fieldLabel(f, t, i18nPrefix) {
  if (f.label) return f.label
  const own = t(`${i18nPrefix}.${f.key}`)
  if (own !== `${i18nPrefix}.${f.key}`) return own
  const generic = t(`fields.${f.key}`)
  if (generic !== `fields.${f.key}`) return generic
  return f.key
}

function optionLabel(f, value, t) {
  if (value === '' || value === null || value === undefined) return ''
  const opt = (f.options || []).find((o) => (o.value ?? o) === value)
  if (opt?.label) return opt.label
  const prefix = f.enumPrefix && f.enumPrefix !== 'none' ? f.enumPrefix : f.key
  const key = `enums.${prefix}.${value}`
  const translated = t(key)
  return translated === key ? String(value) : translated
}

function exampleValueFor(f, refCache) {
  if (f.type === 'select') {
    const opt = (f.options || [])[0]
    return opt ? (opt.value ?? opt) : ''
  }
  if (f.type === 'ref') {
    const first = refCache?.[f.refCollection]?.[0]
    return first ? (first[f.refLabel || 'name'] || first.id) : ''
  }
  if (f.type === 'date') return new Date().toISOString().slice(0, 10)
  if (f.type === 'number') return 0
  if (f.type === 'checkbox') return false
  return ''
}

/**
 * downloadTemplate — an .xlsx with one header row (field labels, in
 * the current language) and one example row, ready to fill and
 * re-upload. `title` names the file; `t`/`lang` come from useLang().
 */
export function downloadTemplate({ config, t, lang }) {
  const fields = importableFields(config)
  const refCache = {}
  fields.forEach((f) => {
    if (f.type === 'ref') refCache[f.refCollection] = db.list(f.refCollection)
  })

  const headers = fields.map((f) => fieldLabel(f, t, config.i18nPrefix))
  const example = fields.map((f) => {
    const v = exampleValueFor(f, refCache)
    if (f.type === 'select') return optionLabel(f, v, t)
    return v
  })

  const ws = XLSX.utils.aoa_to_sheet([headers, example])
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(14, Math.min(36, h.length + 6)) }))
  if (lang === 'ur') ws['!views'] = [{ RTL: true }]
  const wb = XLSX.utils.book_new()
  const sheetName = (t(`${config.i18nPrefix}.title`) || config.collection).slice(0, 31)
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const filename = `${(t(`${config.i18nPrefix}.title`) || config.collection).replace(/[\\/:*?"<>|]+/g, '-')}-${lang === 'ur' ? 'template' : 'template'}.xlsx`
  XLSX.writeFile(wb, filename)
}

function coerceValue(f, raw) {
  if (raw === undefined || raw === null) return undefined
  const str = String(raw).trim()
  if (str === '') return undefined
  if (f.type === 'number') {
    const n = parseFloat(str.replace(/,/g, ''))
    return Number.isFinite(n) ? n : undefined
  }
  if (f.type === 'checkbox') {
    return ['1', 'true', 'yes', 'ہاں', 'y'].includes(str.toLowerCase())
  }
  if (f.type === 'date') {
    // Excel may hand back a Date object, a serial number, or a string.
    if (raw instanceof Date) return raw.toISOString().slice(0, 10)
    const asDate = new Date(str)
    if (!Number.isNaN(asDate.getTime()) && /\d{4}/.test(str)) return asDate.toISOString().slice(0, 10)
    return str
  }
  return str
}

function resolveSelectValue(f, raw, t) {
  const str = String(raw).trim()
  const direct = (f.options || []).find((o) => String(o.value ?? o) === str)
  if (direct) return direct.value ?? direct
  // Match by translated/display label too (Urdu label or English key).
  const byLabel = (f.options || []).find((o) => {
    const v = o.value ?? o
    return optionLabel(f, v, t).trim() === str || String(v).trim() === str
  })
  return byLabel ? (byLabel.value ?? byLabel) : str
}

function resolveRefValue(f, raw, refCache) {
  const str = String(raw).trim()
  const rows = refCache[f.refCollection] || []
  const byId = rows.find((r) => r.id === str)
  if (byId) return byId.id
  const byName = rows.find((r) => (r[f.refLabel || 'name'] || '') === str)
  return byName ? byName.id : str
}

function readFileAsArrayBuffer(file) {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer()
  // Fallback for older/embedded WebViews that lack File.arrayBuffer().
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * parseUploadedFile — reads a File (.xlsx/.xls/.csv), matches its
 * header row back to the tab's fields (by label, in either language,
 * order-independent), and returns { rows, errors, skippedHeaders }.
 * The template's filled-in EXAMPLE row is recognised and skipped
 * automatically, so users can type their data straight below it.
 * Does not save anything — the caller decides what to do with rows.
 */
export async function parseUploadedFile(file, { config, t, lang }) {
  const tOther = tFor(lang === 'ur' ? 'en' : 'ur')
  const buf = await readFileAsArrayBuffer(file)
  const wb = XLSX.read(buf, { type: 'array', cellDates: true })
  const ws = wb.Sheets[wb.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
  if (matrix.length < 1) return { rows: [], errors: [t('import.emptyFile')], skippedHeaders: [] }

  const [headerRow, ...dataRows] = matrix
  const fields = importableFields(config)
  const refCache = {}
  fields.forEach((f) => {
    if (f.type === 'ref') refCache[f.refCollection] = db.list(f.refCollection)
  })

  // Map each spreadsheet column to a field by matching its header
  // text against that field's label in EITHER language, so a
  // template downloaded in Urdu still uploads fine after a language
  // switch, and vice-versa.
  const colToField = headerRow.map((h) => {
    const text = String(h ?? '').trim()
    return fields.find((f) => {
      const a = fieldLabel(f, t, config.i18nPrefix).trim()
      const b = tOther ? fieldLabel(f, tOther, config.i18nPrefix).trim() : null
      return text === a || (b && text === b) || text === f.key
    })
  })

  // The example row shipped inside the downloaded template — never import it.
  const exampleCells = fields.map((f) => {
    const v = exampleValueFor(f, refCache)
    return f.type === 'select' ? optionLabel(f, v, t) : v
  })

  const skippedHeaders = headerRow.filter((h, i) => h && !colToField[i]).map(String)
  const errors = []
  const rows = []

  // Compare each raw row against the example row cell-by-cell using
  // the header→field mapping (order-independent templates still match).
  // Cells are normalised first because Excel converts dates to Date
  // objects and numbers to numeric cells on re-read.
  const normCell = (f, cell) => {
    if (cell === undefined || cell === null) return ''
    if (f.type === 'date') return String(coerceValue(f, cell) ?? '').trim()
    if (f.type === 'number') {
      const s = String(cell).trim()
      if (s === '') return ''
      const n = parseFloat(String(cell).replace(/,/g, ''))
      return Number.isFinite(n) ? String(n) : s
    }
    if (f.type === 'checkbox') {
      return ['1', 'true', 'yes', 'ہاں', 'y'].includes(String(cell).trim().toLowerCase()) ? 'true' : 'false'
    }
    return String(cell).trim()
  }
  const normExample = (f, ex) => {
    if (f.type === 'checkbox') return ex ? 'true' : 'false'
    if (f.type === 'number') return String(parseFloat(ex))
    return String(ex ?? '').trim()
  }
  const matchesExample = (rawRow) => {
    let anyFilled = false
    for (let i = 0; i < colToField.length; i++) {
      const f = colToField[i]
      if (!f) continue
      const cell = rawRow[i]
      const ex = exampleCells[fields.indexOf(f)]
      const cellStr = normCell(f, cell)
      if (cellStr !== '') anyFilled = true
      if (cellStr !== normExample(f, ex)) return false
    }
    return anyFilled
  }

  let exampleSkipped = false

  dataRows.forEach((rawRow, rIdx) => {
    const isBlank = rawRow.every((c) => String(c ?? '').trim() === '')
    if (isBlank) return
    if (!exampleSkipped && matchesExample(rawRow)) {
      exampleSkipped = true // template's example row — silently ignore
      return
    }
    const rec = {}
    colToField.forEach((f, cIdx) => {
      if (!f) return
      const cell = rawRow[cIdx]
      if (cell === undefined || cell === '' || cell === null) return
      if (f.type === 'select') rec[f.key] = resolveSelectValue(f, cell, t)
      else if (f.type === 'ref') rec[f.key] = resolveRefValue(f, cell, refCache)
      else {
        const v = coerceValue(f, cell)
        if (v !== undefined) rec[f.key] = v
      }
    })
    const missing = fields.filter((f) => f.required && (rec[f.key] === undefined || rec[f.key] === ''))
    if (missing.length) {
      errors.push(t('import.rowMissing', { row: rIdx + 2, fields: missing.map((f) => fieldLabel(f, t, config.i18nPrefix)).join(', ') }))
      return
    }
    if (Object.keys(rec).length) rows.push(rec)
  })

  return { rows, errors, skippedHeaders }
}

/** Saves parsed rows as new records in the given collection. Returns count saved. */
export function importRows(collection, rows) {
  rows.forEach((rec) => db.save(collection, rec))
  return rows.length
}
