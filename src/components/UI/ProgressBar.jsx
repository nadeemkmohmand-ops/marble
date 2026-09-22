import React from 'react'
import { cn } from '../../utils/cn'

export default function ProgressBar({ value = 0, max = 100, tone, className, showLabel = false }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            tone || 'bg-gradient-to-r from-flame-400 to-flame-600 shadow-[0_0_8px_rgba(249,115,22,0.45)]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <span className="text-[11px] num text-[var(--muted)]">{Math.round(pct)}%</span>}
    </div>
  )
}
