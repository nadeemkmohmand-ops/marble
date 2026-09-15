import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { cn } from '../../utils/cn.js'

/**
 * Drawer — side-sheet variant of Modal (mobile filters, detail panels).
 * side="start" (sidebar side, default) | side="end". RTL aware.
 * Escape + backdrop click + scroll lock + focus trap (via useFocusTrap).
 */
export default function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  side = 'start',
  width = 'max-w-sm',
}) {
  const { t } = useLanguage()
  const trapRef = useFocusTrap({ active: open })

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* panel */}
      <div
        ref={trapRef}
        tabIndex={-1}
        className={cn(
          'surface fade-up absolute inset-y-0 flex w-full flex-col rounded-none shadow-2xl',
          width,
          side === 'start' ? 'start-0' : 'end-0'
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 dark:border-gray-700">
          <h3 className="text-base font-bold text-main">{title}</h3>
          <button type="button" onClick={onClose} className="icon-btn" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4 dark:border-gray-700">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
