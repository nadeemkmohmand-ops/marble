import React, { useRef, useState } from 'react'
import { Upload, FileDown, ChevronDown, Loader2 } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useLang } from '../../context/LanguageContext'
import { useToast } from '../../context/ToastContext'
import { useClickOutside } from '../../hooks/useClickOutside'
import { downloadTemplate, parseUploadedFile, importRows } from '../../utils/bulkImportExport'
import Modal from './Modal'
import Button from './Button'

/**
 * ImportButton — "download a template, fill it in, upload it back"
 * for a CrudPage tab. Sits next to ExportMenu in the toolbar.
 */
export default function ImportButton({ config, size = 'md' }) {
  const { t, lang } = useLang()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(null) // { rows, errors, skippedHeaders }
  const ref = useRef(null)
  const fileRef = useRef(null)

  useClickOutside(ref, () => setOpen(false), open)

  const onPickFile = () => {
    setOpen(false)
    fileRef.current?.click()
  }

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    try {
      const result = await parseUploadedFile(file, { config, t, lang })
      setPreview(result)
    } catch (err) {
      toast.error(t('import.parseError'))
    } finally {
      setBusy(false)
    }
  }

  const confirmImport = () => {
    if (!preview?.rows?.length) return
    const count = importRows(config.collection, preview.rows)
    if (preview.errors.length) {
      toast.success(t('import.partialSuccess', { count, errorCount: preview.errors.length }))
    } else {
      toast.success(t('import.success', { count }))
    }
    setPreview(null)
  }

  return (
    <div className="relative no-print" ref={ref}>
      <button
        className={cn('btn btn-secondary', size === 'sm' ? 'min-h-8 px-3 text-xs' : 'min-h-10 px-4 text-sm')}
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
      >
        {busy ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        <span className="hidden sm:inline">{t('import.upload')}</span>
        <ChevronDown size={13} className={cn('transition', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute end-0 top-full mt-1 z-50 card p-1.5 w-64 shadow-xl fade-in">
          <button
            className="w-full btn btn-ghost justify-start gap-2.5 min-h-9 px-2.5 text-sm rounded-lg"
            onClick={() => {
              setOpen(false)
              downloadTemplate({ config, t, lang })
            }}
          >
            <FileDown size={15} />
            <span className="leading-urdu no-clip">{t('import.downloadTemplate')}</span>
          </button>
          <button className="w-full btn btn-ghost justify-start gap-2.5 min-h-9 px-2.5 text-sm rounded-lg" onClick={onPickFile}>
            <Upload size={15} />
            <span className="leading-urdu no-clip">{t('import.uploadFile')}</span>
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />

      {preview && (
        <Modal
          open
          onClose={() => setPreview(null)}
          title={t('import.title')}
          size="sm"
          footer={
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setPreview(null)}>{t('import.cancel')}</Button>
              <Button onClick={confirmImport} disabled={!preview.rows.length}>{t('import.confirmImport')}</Button>
            </div>
          }
        >
          <div className="space-y-3 text-sm leading-urdu no-clip">
            {preview.rows.length > 0 ? (
              <p>{t('import.confirm', { count: preview.rows.length, title: t(`${config.i18nPrefix}.title`) })}</p>
            ) : (
              <p className="text-danger">{t('import.noneImported')}</p>
            )}
            {preview.skippedHeaders?.length > 0 && (
              <p className="text-[12px] text-[var(--muted)]">{t('import.unknownColumns', { columns: preview.skippedHeaders.join(', ') })}</p>
            )}
            {preview.errors?.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-lg border border-[var(--border)] p-2 space-y-1">
                {preview.errors.map((e, i) => (
                  <p key={i} className="text-[12px] text-danger">{e}</p>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}
