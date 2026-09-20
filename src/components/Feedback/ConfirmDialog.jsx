import React from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import { useLang } from '../../context/LanguageContext'
import { AlertTriangle } from 'lucide-react'

/** Promise-based confirm dialog driven by AppUIContext.confirm(). */
export default function ConfirmDialog({ state, onResolve }) {
  const { t } = useLang()
  if (!state) return null // nothing requested → don't render
  return (
    <Modal open onClose={() => onResolve(false)} title={state?.title || t('common.confirmTitle')} size="sm">
      <div className="flex gap-3 items-start">
        <div className="h-10 w-10 shrink-0 rounded-full bg-red-500/15 text-red-500 grid place-items-center">
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm leading-urdu no-clip pt-1">{state?.message || t('common.confirmDelete')}</p>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={() => onResolve(false)}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={() => onResolve(true)}>
          {state?.confirmLabel || t('common.delete')}
        </Button>
      </div>
    </Modal>
  )
}
