import React from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'
import { cn } from '../../utils/cn'

const ICONS = {
  success: { icon: CheckCircle2, cls: 'text-emerald-500' },
  error: { icon: AlertTriangle, cls: 'text-red-500' },
  info: { icon: Info, cls: 'text-sky-500' },
}

export default function Toast({ toast, onDismiss }) {
  const { icon: Icon, cls } = ICONS[toast.type] || ICONS.info
  return (
    <div
      className={cn(
        'toast pointer-events-auto flex items-center gap-2.5 card px-4 py-3 shadow-xl max-w-md w-full fade-in',
        'leading-urdu no-clip',
      )}
      role="status"
    >
      <Icon size={18} className={cn('shrink-0', cls)} />
      <span className="text-sm flex-1">{toast.message}</span>
      <button onClick={() => onDismiss(toast.id)} className="text-[var(--muted)] hover:text-[var(--text)]" aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}
