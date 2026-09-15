import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useFocusTrap } from '../../hooks/useFocusTrap.js'
import { useLanguage } from '../../context/LanguageContext.jsx'

/**
 * Modal — bottom-sheet on mobile, centered dialog on sm+.
 * Closes on backdrop click, Escape key, or the X button. UI only.
 * A11y: focus is trapped inside while open (Tab cycles), and returned
 * to the trigger element on close (useFocusTrap).
 */
export default function Modal({ open, onClose, title, children, footer, wide = false }) {
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
      className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      {/* dialog */}
      <div
        ref={trapRef}
        tabIndex={-1}
        className={`surface fade-up relative flex max-h-[85vh] w-full flex-col rounded-t-2xl shadow-2xl sm:rounded-2xl ${
          wide ? 'sm:max-w-2xl' : 'sm:max-w-lg'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 dark:border-gray-700">
          <h3 className="text-base font-bold text-main">{title}</h3>
          <button type="button" onClick={onClose} className="icon-btn" aria-label={t('common.close')}>
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4">{children}</div>

        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 border-t border-border px-5 py-4 dark:border-gray-700">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
