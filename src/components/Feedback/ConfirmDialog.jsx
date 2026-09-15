import { AlertTriangle } from 'lucide-react'
import Modal from '../UI/Modal.jsx'
import Button from '../UI/Button.jsx'
import { useLanguage } from '../../context/LanguageContext.jsx'

/**
 * ConfirmDialog — reusable destructive-action confirmation, built on Modal.
 *
 *   const [confirmOpen, setConfirmOpen] = useState(false)
 *   <ConfirmDialog
 *     open={confirmOpen}
 *     onClose={() => setConfirmOpen(false)}
 *     onConfirm={() => { /* do the destructive thing *\/ }}
 *     title={t('confirm.deleteTitle')}
 *     message={t('confirm.deleteMessage')}
 *   />
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  confirmVariant = 'danger',
  icon: Icon = AlertTriangle,
}) {
  const { t } = useLanguage()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title ?? t('confirm.defaultTitle')}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel ?? t('common.cancel')}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmLabel ?? t('confirm.confirm')}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-error/10 text-error">
          <Icon size={20} aria-hidden="true" />
        </span>
        <p className="pt-1 text-sm leading-relaxed text-muted">{message}</p>
      </div>
    </Modal>
  )
}
