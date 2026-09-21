import React from 'react'
import Modal from '../UI/Modal'
import Button from '../UI/Button'
import { useLang } from '../../context/LanguageContext'
import { useAppUI } from '../../context/AppUIContext'
import { AlertTriangle } from 'lucide-react'

/**
 * FIX: self-contained — reads the confirm request from AppUIContext
 * itself. Before, it depended on props that were never passed
 * (<ConfirmDialog /> in App.jsx), so `state` was always undefined,
 * the dialog never rendered and the promise behind confirm() never
 * resolved → nothing in the app could ever be deleted.
 */
export default function ConfirmDialog() {
  const { t } = useLang()
  const { confirmState, resolveConfirm } = useAppUI()
  if (!confirmState) return null // nothing requested → don't render
  return (
    <Modal open onClose={() => resolveConfirm(false)} title={confirmState?.title || t('common.confirmTitle')} size="sm">
      <div className="flex gap-3 items-start">
        <div className="h-10 w-10 shrink-0 rounded-full bg-red-500/15 text-red-500 grid place-items-center">
          <AlertTriangle size={18} />
        </div>
        <p className="text-sm leading-urdu no-clip pt-1">{confirmState?.message || t('common.confirmDelete')}</p>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={() => resolveConfirm(false)}>
          {t('common.cancel')}
        </Button>
        <Button variant="danger" onClick={() => resolveConfirm(true)}>
          {confirmState?.confirmLabel || t('common.delete')}
        </Button>
      </div>
    </Modal>
  )
}
