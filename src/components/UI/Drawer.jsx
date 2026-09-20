import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Drawer({ open, onClose, title, children, side = 'end', width = 'max-w-md' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  const pos = side === 'end' ? (document.documentElement.dir === 'rtl' ? 'left-0' : 'right-0') : document.documentElement.dir === 'rtl' ? 'right-0' : 'left-0'

  return (
    <div className="fixed inset-0 z-[80]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('absolute top-0 bottom-0 w-full card rounded-none border-y-0 flex flex-col fade-in', pos, width)}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
          <h2 className="font-semibold no-clip">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost h-9 w-9 justify-center rounded-lg" aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 flex-1 safe-bottom">{children}</div>
      </div>
    </div>
  )
}
