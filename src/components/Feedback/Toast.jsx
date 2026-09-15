import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { cn } from '../../utils/cn.js'

const TYPES = {
  success: { icon: CheckCircle2, accent: 'border-s-success', iconClass: 'text-success' },
  error: { icon: XCircle, accent: 'border-s-error', iconClass: 'text-error' },
  warning: { icon: AlertTriangle, accent: 'border-s-warning', iconClass: 'text-warning' },
  info: { icon: Info, accent: 'border-s-primary', iconClass: 'text-primary dark:text-primary-light' },
}

function ToastItem({ toast, onDismiss }) {
  const { id, type = 'info', message, duration = 4000, action } = toast
  const { t } = useLanguage()
  const { icon: Icon, accent, iconClass } = TYPES[type] ?? TYPES.info

  useEffect(() => {
    if (!duration) return undefined
    const timer = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <div
      role="alert"
      className={cn(
        'surface toast-in pointer-events-auto flex w-full max-w-xs items-start gap-2.5 border-s-4 p-3 shadow-lg',
        accent
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', iconClass)} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-xs font-medium leading-relaxed text-main">{message}</p>
      {action && (
        <button
          type="button"
          onClick={() => {
            action.onClick?.()
            onDismiss(id)
          }}
          className="shrink-0 rounded-lg px-2 py-1 text-[11px] font-bold text-primary transition-colors hover:bg-secondary dark:text-primary-light dark:hover:bg-gray-700"
        >
          {action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="icon-btn h-6 w-6 shrink-0"
        aria-label={t('common.close')}
      >
        <X size={12} />
      </button>
    </div>
  )
}

/**
 * ToastViewport — stacked toasts, top-end corner, announced politely to
 * screen readers via the aria-live region. Rendered by <ToastProvider>.
 */
export default function ToastViewport({ toasts, onDismiss }) {
  const { t } = useLanguage()
  return (
    <div
      aria-live="polite"
      role="region"
      aria-label={t('set.notifications')}
      className="pointer-events-none fixed end-4 top-20 z-[70] flex w-full max-w-xs flex-col items-end gap-2 sm:top-[4.5rem]"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}
