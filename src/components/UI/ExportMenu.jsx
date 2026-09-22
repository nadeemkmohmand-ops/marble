import React, { useEffect, useRef, useState } from 'react'
import { Download, FileText, FileSpreadsheet, File as FileIcon, MessageCircle, Share2, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useLang } from '../../context/LanguageContext'
import { useExport } from '../../hooks/useExport'
import { useToast } from '../../context/ToastContext'

/**
 * ExportMenu — the universal "save & share" control present on every
 * data page: Excel / PDF / Word / CSV / WhatsApp / Native share.
 * PDF downloads a real .pdf file instantly — no print dialog anywhere.
 */
export default function ExportMenu({ title, columns, rows, meta, size = 'md', label }) {
  const { t, lang } = useLang()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const ex = useExport({ title, columns, rows, meta })

  useEffect(() => {
    const onClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const items = [
    { icon: FileSpreadsheet, label: 'Excel (.xlsx)', run: ex.xlsx, tone: 'export-item-xlsx' },
    { icon: FileText, label: t('common.pdf'), run: ex.pdf, tone: 'export-item-pdf' },
    { icon: FileIcon, label: 'Word (.doc)', run: ex.doc, tone: 'export-item-doc' },
    { icon: Download, label: 'CSV', run: ex.csv, tone: 'export-item-csv' },
    { icon: MessageCircle, label: 'WhatsApp', run: () => ex.whatsapp(meta?.phone), tone: 'export-item-whatsapp' },
    { icon: Share2, label: t('common.share'), run: () => ex.share().then((m) => m === 'cancelled' && null), tone: 'export-item-share' },
  ]

  return (
    <div className="relative no-print" ref={ref}>
      <button className={cn('btn btn-teal', size === 'sm' ? 'min-h-8 px-3 text-xs' : 'min-h-10 px-4 text-sm')} onClick={() => setOpen((o) => !o)}>
        <Download size={15} />
        {label ?? t('common.export')}
        <ChevronDown size={13} className={cn('transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="export-menu absolute end-0 top-full mt-1 z-50 rounded-xl p-1.5 w-56 shadow-xl fade-in">
          <div className="px-2.5 py-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">{title}</div>
          <div className="flex flex-col gap-1">
            {items.map(({ icon: Icon, label: l, run, tone }) => (
              <button
                key={l}
                className={cn('export-item', tone)}
                onClick={() => {
                  setOpen(false)
                  try {
                    run()
                  } catch (e) {
                    toast.error(e?.message || 'Export failed')
                  }
                }}
              >
                <Icon size={15} />
                <span className="leading-urdu no-clip">{l}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
