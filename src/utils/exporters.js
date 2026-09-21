// ─────────────────────────────────────────────────────────────────
// exporters.js — save / share any table in the app:
//   Excel (.xlsx) · Word (.doc) · PDF (real one-click .pdf download,
//   perfect Urdu rendering — the print dialog was removed) · CSV
//   (UTF-8 BOM so Excel opens it correctly) · WhatsApp (full readable
//   summary + optional file via Web Share).
// ─────────────────────────────────────────────────────────────────
import * as XLSX from 'xlsx'
import { fmtDate, bidiSafe } from './formatters'
import { getFactoryName, factoryFileTag } from './factory'
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

/** Every download filename starts with the factory name. */
function dlName(title) {
  return `${factoryFileTag()}-${safeName(title)}`
}

/** columns: [{key, label, format?}] · rows: [objects] */
function toMatrix(columns, rows, rtl = false) {
  const head = columns.map((c) => bidiSafe(c.label, rtl))
  const body = rows.map((r) =>
    columns.map((c) => {
      const v = typeof c.format === 'function' ? c.format(r[c.key], r) : r[c.key]
      return bidiSafe(v === null || v === undefined ? '' : String(v), rtl)
    }),
  )
  return [head, ...body]
}

export function exportCSV({ title, columns, rows, lang = 'en' }) {
  const rtl = lang === 'ur'
  const matrix = toMatrix(columns, rows, rtl)
  // Factory banner rows — every download names the factory.
  matrix.unshift([], [`${getFactoryName(lang)} — ${title} — ${fmtDate(new Date())}`], [getFactoryName(lang)])
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
  downloadBlob(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }), `${dlName(title)}.csv`)
}

export function exportXLSX({ title, columns, rows, sheetName, lang = 'en' }) {
  const rtl = lang === 'ur'
  const matrix = toMatrix(columns, rows, rtl)
  // Factory banner rows — every download names the factory.
  matrix.unshift([], [`${getFactoryName(lang)} — ${title} — ${fmtDate(new Date())}`], [getFactoryName(lang)])
  const ws = XLSX.utils.aoa_to_sheet(matrix)
  ws['!cols'] = columns.map((c) => ({ wch: Math.max(12, Math.min(40, c.label.length + 8)) }))
  // RTL sheet when the title is Urdu-ish (contains Arabic-block chars)
  if (/[\u0600-\u06FF]/.test(title) || rtl) ws['!views'] = [{ RTL: true }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, (sheetName || safeName(title)).slice(0, 31))
  XLSX.writeFile(wb, `${dlName(title)}.xlsx`)
}

export function exportDOC({ title, columns, rows, meta = {}, lang = 'en' }) {
  const rtl = lang === 'ur'
  const dir = rtl ? 'rtl' : 'ltr'
  const font = rtl ? "'Noto Nastaliq Urdu', serif" : "'Inter', Arial, sans-serif"
  const matrix = toMatrix(columns, rows, rtl)
  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}"><head><meta charset="utf-8">
<title>${escapeHtml(getFactoryName(lang))} — ${escapeHtml(title)}</title>
<style>
  body { font-family:${font}; direction:${dir}; }
  h1 { text-align:center; font-size:18px; }
  .meta { text-align:center; font-size:12px; color:#444; margin-bottom:12px; }
  table { border-collapse:collapse; width:100%; font-size:12px; }
  th, td { border:1px solid #999; padding:6px 8px; text-align:${rtl ? 'right' : 'left'};
    unicode-bidi:plaintext; }
  th { background:#e8eef5; }
</style></head><body>
<h1>${escapeHtml(getFactoryName(lang))}</h1>
<div class="meta">${escapeHtml(title)} — ${fmtDate(new Date())}</div>
<table>
<thead><tr>${matrix[0].map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
<tbody>${matrix.slice(1).map((line) => `<tr>${line.map((c) => `<td>${escapeHtml(c)}</td>`).join('')}</tr>`).join('')}</tbody>
</table>
</body></html>`
  downloadBlob(new Blob(['\uFEFF' + html], { type: 'application/msword;charset=utf-8' }), `${dlName(title)}.doc`)
}

/**
 * downloadPDF — a REAL one-click PDF file, no print dialog, no manual
 * "Save as PDF" step. Renders the document off-screen in the current
 * page (so the app's own self-hosted Urdu/Inter fonts are already
 * loaded — works fully offline) and rasterizes it with html2canvas,
 * then embeds that image into a PDF page-by-page with jsPDF. Because
 * it's a picture of real, already-correct HTML, Urdu/Nastaliq shaping
 * comes out exactly as it looks on screen.
 *
 * FIX (blank-PDF bug): html2pdf keeps the source element's own
 * `position:fixed` in its render copy, and a fixed clone escapes the
 * render container's flow — the container collapses to height 0 and
 * the PDF comes out BLANK. The fix is to render an INNER, static
 * (in-flow) child while the off-screen wrapper holds it. The inner
 * width is exactly the A4 inner width (210mm − 2×10mm margins =
 * 190mm ≈ 718px) so nothing is clipped or squeezed.
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

  // The element handed to html2pdf must be in normal flow (static).
  // Prefer the template's own .print-doc wrapper; otherwise wrap.
  let src = holder.querySelector('.print-doc')
  if (!src) {
    src = document.createElement('div')
    src.innerHTML = html
    holder.appendChild(src)
  }
  src.style.cssText += ';width:718px;margin:0;background:#fff;'

  try {
    await html2pdf()
      .set({
        filename: `${dlName(title)}.pdf`,
        margin: 10,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        // 'avoid-all' moves a whole row/heading/footer to the next page
        // instead of slicing through the middle of the text — this is
        // what fixed the "bottom line is cut" problem.
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      })
      .from(src)
      .save()
  } finally {
    holder.remove()
  }
}

/** Single record → readable WhatsApp message with ALL info. */
export function recordToText({ title, fields, record, lang = 'en' }) {
  const L = lang === 'ur'
  const lines = [`*${getFactoryName(lang)}*`, `*${title}*`, '']
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
  const lines = [`*${getFactoryName(lang)}*`, `*${title}* (${L ? 'کل' : 'Total'}: ${rows.length})`, '']
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

export const exporters = { exportCSV, exportXLSX, exportDOC, downloadPDF, whatsappText, shareFile, recordToText, tableToText }
export default exporters
