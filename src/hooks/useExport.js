import { useMemo } from 'react'
import { useLang } from '../context/LanguageContext'
import {
  exportCSV, exportXLSX, exportDOC, printDocument, whatsappText, shareFile, tableToText, recordToText,
} from '../utils/exporters'
import { wrapStyled } from '../utils/printTemplates'
import { useAppUI } from '../context/AppUIContext'

/**
 * useExport({ title, columns, rows }) — every page gets the full
 * export suite in one hook: xlsx / pdf / doc / csv / whatsapp / share.
 */
export function useExport({ title, columns, rows, meta } = {}) {
  const { lang, t } = useLang()
  const { requestPrint } = useAppUI()

  return useMemo(() => {
    const ctx = { title: typeof title === 'function' ? title() : title, columns, rows, lang }
    const run = (fn) => () => fn(ctx)
    return {
      csv: run(exportCSV),
      xlsx: run(exportXLSX),
      doc: run(exportDOC),
      pdf: () =>
        printDocument(
          wrapStyled(
            stockTableHTML(ctx),
            { title: ctx.title, lang },
          ),
          { title: ctx.title },
        ),
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
      printTable: () => requestPrint({ template: 'stockReport', data: { rows, columns, title: ctx.title }, title: ctx.title }),
      _ctx: ctx,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, columns, rows, lang, t, requestPrint])
}

function toCsvText({ columns, rows }) {
  const esc = (s) => `"${String(s ?? '').replace(/"/g, '""')}"`
  const lines = [columns.map((c) => esc(c.label)).join(',')]
  rows.forEach((r) => lines.push(columns.map((c) => esc(r[c.key])).join(',')))
  return lines.join('\r\n')
}

function stockTableHTML({ columns, rows }) {
  const head = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('')
  const body = rows
    .map(
      (r) =>
        `<tr>${columns
          .map((c) => `<td>${escapeHtml(typeof c.format === 'function' ? c.format(r[c.key], r) : r[c.key] ?? '')}</td>`)
          .join('')}</tr>`,
    )
    .join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function escapeHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default useExport
