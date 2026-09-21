import { useMemo } from 'react'
import { useLang } from '../context/LanguageContext'
import {
  exportCSV, exportXLSX, exportDOC, downloadPDF, whatsappText, shareFile, tableToText, recordToText,
} from '../utils/exporters'
import { wrapStyled, escBidi } from '../utils/printTemplates'
import { getFactoryName } from '../utils/factory'
import { useToast } from '../context/ToastContext'

/**
 * useExport({ title, columns, rows }) — every page gets the full
 * export suite in one hook: xlsx / pdf / doc / csv / whatsapp / share.
 * PDF is a REAL one-click file download — the print dialog was removed.
 */
export function useExport({ title, columns, rows, meta } = {}) {
  const { lang, t } = useLang()
  const toast = useToast()

  return useMemo(() => {
    const ctx = { title: typeof title === 'function' ? title() : title, columns, rows, lang }
    const run = (fn) => () => fn(ctx)
    return {
      csv: run(exportCSV),
      xlsx: run(exportXLSX),
      doc: run(exportDOC),
      // Real one-click file download — no print dialog, no manual "Save as PDF".
      pdf: async () => {
        try {
          await downloadPDF(
            wrapStyled(stockTableHTML(ctx), { title: ctx.title, lang }),
            { title: ctx.title, lang },
          )
        } catch (e) {
          toast.error(t('common.error'))
        }
      },
      whatsapp: (phone) => whatsappText(tableToText({ ...ctx, lang }), phone),
      share: async () => {
        const csv = toCsvText(ctx)
        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
        await shareFile({
          title: ctx.title,
          text: tableToText({ ...ctx, lang }),
          filename: `${ctx.title}.csv`,
          blob,
        })
      },
      _ctx: ctx,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, columns, rows, lang, t, toast])
}

function toCsvText({ columns, rows, lang = 'en' }) {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`
  const lines = [`"${getFactoryName(lang)}"`, `"${columns.map((c) => esc(c.label)).join(',')}"`]
  rows.forEach((r) => lines.push(columns.map((c) => esc(r[c.key])).join(',')))
  return lines.join('\r\n')
}

function stockTableHTML({ columns, rows }) {
  // escBidi = escape + wrap pure-Latin runs in <span dir="ltr"> so the
  // PDF rasterizer (html2canvas) cannot mirror "(in)" into ")in(" or
  // reorder Latin words inside RTL documents.
  const head = columns.map((c) => `<th>${escBidi(c.label)}</th>`).join('')
  const body = rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => `<td>${escBidi(typeof c.format === 'function' ? c.format(r[c.key], r) : r[c.key] ?? '')}</td>`)
          .join('')}</tr>`,
    )
    .join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

export default useExport
