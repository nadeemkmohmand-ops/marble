// ─────────────────────────────────────────────────────────────────
// exporters.js — save / share any table in the app:
//   Excel (.xlsx) · Word (.doc) · PDF (via print dialog — perfect
//   Urdu rendering) · CSV (UTF-8 BOM so Excel opens it correctly) ·
//   WhatsApp (full readable summary + optional file via Web Share).
// ─────────────────────────────────────────────────────────────────
import * as XLSX from 'xlsx'
import { fmtDate } from './formatters'
import APP_CONFIG from '../config/app.config'

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}

function safeName(name) {
  return String(name || 'export').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)
}

/** columns: [{key, label, format?}] · rows: [objects] */
function toMatrix(columns, rows) {
  const head = columns.map((c) => c.label)
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = typeof c.format === 'function' ? c.format(r[c.key], r) : r[c.key]
      return v === null || v === undefined ? '' : String(v)
    }),
  )
  return [head, ...body]
}

export function exportCSV({ title, columns, rows }) {
  const matrix = toMatrix(columns, rows)
  const csv = matrix
    .map((line) =>
      line
        .map((cell) => {
          const s = String(cell).replace(/"/g, '""')
          return /[",\n]/.test(s) ? `"${s}"` : s
        })
        .join(','),
    )
    .join('\r\n')
  // BOM → Excel/Sheets detect UTF-8 (Urdu shows correctly)
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), `${safeName(title)}.csv`)
}

export function exportXLSX({ title, columns, rows, sheetName }) {
  const matrix = toMatrix(columns, rows)
  const ws = XLSX.utils.aoa_to_sheet(matrix)
  ws['!cols'] = columns.map((c) => ({ wch: Math.max(12, Math.min(40, c.label.length + 8)) }))
  // RTL sheet when the title is Urdu-ish (contains Arabic-block chars)
  if (/[\u0600-\u06FF]/.test(title)) ws['!views'] = [{ RTL: true }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, (sheetName || safeName(title)).slice(0, 31))
  XLSX.writeFile(wb, `${safeName(title)}.xlsx`)
}

export function exportDOC({ title, columns, rows, meta = {}, lang = 'en' }) {
  const rtl = lang === 'ur'
  const dir = rtl ? 'rtl' : 'ltr'
  const font = rtl ? "'Noto Nastaliq Urdu', serif" : "'Inter', Arial, sans-serif"
  const matrix = toMatrix(columns, rows)
  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family:${font}; direction:${dir}; }
  h1 { text-align:center; font-size:18px; }
  .meta { text-align:center; font-size:12px; color:#444; margin-bottom:12px; }
  table { border-collapse:collapse; width:100%; font-size:12px; }
  th, td { border:1px solid #999; padding:6px 8px; text-align:${rtl ? 'right' : 'left'}; }
  th { background:#e8eef5; }
</style></head><body>
<h1>${escapeHtml(title)}</h1>
<div class="meta">${escapeHtml(meta.company || APP_CONFIG.appName)} — ${fmtDate(new Date())}</div>
<table>
<thead><tr>${matrix[0].map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
<tbody>${matrix.slice(1).map((line) => `<tr>${line.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
</body></html>`
  downloadBlob(new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' }), `${safeName(title)}.doc`)
}

/** PDF = print dialog → "Save as PDF". This keeps Urdu shaping perfect. */
export function printDocument(html, { title = 'Document' } = {}) {
  const frame = document.createElement('iframe')
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.appendChild(frame)
  const doc = frame.contentDocument
  doc.open()
  doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;600&family=Inter:wght@400;600&display=swap">
</head><body>${html}
<script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script>
</body></html>`)
  doc.close()
  setTimeout(() => frame.remove(), 60000)
}

/**
 * downloadPDF — a REAL one-click PDF file, no print dialog, no manual
 * "Save as PDF" step. Renders the document off-screen in the current
 * page (so the app's own self-hosted Urdu/Inter fonts are already
 * loaded — works fully offline) and rasterizes it with html2canvas,
 * then embeds that image into a PDF page-by-page with jsPDF. Because
 * it's a picture of real, already-correct HTML, Urdu/Nastaliq shaping
 * comes out exactly as it looks on screen.
 */
export async function downloadPDF(html, { title = 'Document', lang = 'en' } = {}) {
  const { default: html2pdf } = await import('html2pdf.js')
  const rtl = lang === 'ur'

  const holder = document.createElement('div')
  holder.style.cssText = 'position:fixed;left:-99999px;top:0;width:794px;background:#fff;'
  holder.dir = rtl ? 'rtl' : 'ltr'
  holder.lang = lang
  holder.className = rtl ? 'urdu-text' : ''
  holder.innerHTML = html
  document.body.appendChild(holder)

  try {
    await html2pdf()
      .set({
        filename: `${safeName(title)}.pdf`,
        margin: 10,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] },
      })
      .from(holder)
      .save()
  } finally {
    holder.remove()
  }
}

/** Single record → readable WhatsApp message with ALL info. */
export function recordToText({ title, fields, record, lang = 'en' }) {
  const L = lang === 'ur'
  const lines = [`*${title}*`, '']
  fields.forEach((f) => {
    const label = f.label
    let v = typeof f.format === 'function' ? f.format(record[f.key], record) : record[f.key]
    if (v === null || v === undefined || v === '') v = '—'
    lines.push(`${label}: ${v}`)
  })
  lines.push('')
  lines.push(L ? `مکمل تفصیل ایپ میں: ${APP_CONFIG.appUrl}` : `Full details in app: ${APP_CONFIG.appUrl}`)
  return lines.join('\n')
}

/** Table → WhatsApp friendly text summary. */
export function tableToText({ title, columns, rows, limit = 25, lang = 'en' }) {
  const L = lang === 'ur'
  const lines = [`*${title}* (${L ? 'کل' : 'Total'}: ${rows.length})`, '']
  rows.slice(0, limit).forEach((r, i) => {
    const cells = columns.slice(0, 6).map((c) => {
      const v = typeof c.format === 'function' ? c.format(r[c.key], r) : r[c.key]
      return `${c.label}: ${v ?? '—'}`
    })
    lines.push(`${i + 1}. ${cells.join(' | ')}`)
    lines.push('')
  })
  if (rows.length > limit) lines.push(L ? `… اور ${rows.length - limit} مزید` : `… and ${rows.length - limit} more`)
  lines.push(L ? `مکمل رپورٹ ایپ میں: ${APP_CONFIG.appUrl}` : `Full report in app: ${APP_CONFIG.appUrl}`)
  return lines.join('\n')
}

export function whatsappText(text, phone) {
  const base = phone
    ? `https://wa.me/${String(phone).replace(/[^\d]/g, '')}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(base, '_blank', 'noopener')
}

/** Web Share with attached file (mobile) — falls back to WhatsApp text. */
export async function shareFile({ title, text, filename, blob, phone }) {
  try {
    const file = new File([blob], filename, { type: blob.type })
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, text, files: [file] })
      return 'shared'
    }
    if (navigator.share) {
      await navigator.share({ title, text })
      return 'shared'
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled'
  }
  whatsappText(text, phone)
  return 'whatsapp'
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export const exporters = { exportCSV, exportXLSX, exportDOC, printDocument, downloadPDF, whatsappText, shareFile, recordToText, tableToText }
export default exporters
