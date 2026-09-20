import React, { useEffect, useRef, useState } from 'react'
import { Download, FileText, FileSpreadsheet, File as FileIcon, MessageCircle, Share2, Printer, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useLang } from '../../context/LanguageContext'
import { useExport } from '../../hooks/useExport'
import { useToast } from '../../context/ToastContext'

/**
 * ExportMenu — the universal "save & share" control present on every
 * data page: Excel / PDF / Word / CSV / WhatsApp / Native share / Print.
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
    { icon: FileSpreadsheet, label: 'Excel (.xlsx)', run: ex.xlsx },
    { icon: FileText, label: t('common.pdf'), run: ex.pdf },
    { icon: FileIcon, label: 'Word (.doc)', run: ex.doc },
    { icon: Download, label: 'CSV', run: ex.csv },
    { icon: MessageCircle, label: 'WhatsApp', run: () => ex.whatsapp(meta?.phone), tone: 'text-[#25D366]' },
    { icon: Share2, label: t('common.share'), run: () => ex.share().then((m) => m === 'cancelled' && null) },
    { icon: Printer, label: t('common.print'), run: ex.printTable },
  ]

  return (
    <div className="relative no-print" ref={ref}>
      <button className={cn('btn btn-secondary', size === 'sm' ? 'min-h-8 px-3 text-xs' : 'min-h-10 px-4 text-sm')} onClick={() => setOpen((o) => !o)}>
        <Download size={15} />
        {label ?? t('common.export')}
        <ChevronDown size={13} className={cn('transition', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute end-0 top-full mt-1 z-50 card p-1.5 w-56 shadow-xl fade-in">
          <div className="px-2.5 py-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">{title}</div>
          {items.map(({ icon: Icon, label: l, run, tone }) => (
            <button
              key={l}
              className="w-full btn btn-ghost justify-start gap-2.5 min-h-9 px-2.5 text-sm rounded-lg"
              onClick={() => {
                setOpen(false)
                try {
                  run()
                } catch (e) {
                  toast.error(e?.message || 'Export failed')
                }
              }}
            >
              <Icon size={15} className={tone} />
              <span className={cn('leading-urdu no-clip', tone)}>{l}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
