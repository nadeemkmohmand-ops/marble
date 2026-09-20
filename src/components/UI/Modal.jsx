import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Modal({ open, onClose, title, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null
  const widths = { sm: 'max-w-sm', md: 'max-w-2xl', lg: 'max-w-4xl', xl: 'max-w-6xl' }

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          // dvh (dynamic viewport height) shrinks with the on-screen keyboard,
          // unlike vh — this is what keeps the Save button reachable on mobile.
          'relative card w-full max-h-[92vh] max-h-[92dvh] flex flex-col rounded-b-none sm:rounded-2xl animate-[fadeIn_.2s_ease]',
          widths[size],
        )}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-[var(--border)] shrink-0">
          <h2 className="font-semibold text-base modal-title no-clip">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost h-9 w-9 justify-center rounded-lg" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-5 py-4 flex-1 min-h-0">{children}</div>
        {footer && <div className="shrink-0 px-5 py-3 border-t border-[var(--border)] safe-bottom bg-[var(--card)]">{footer}</div>}
      </div>
    </div>
  )
}
