import React from 'react'
import { cn } from '../../utils/cn'

export default function ProgressBar({ value = 0, max = 100, tone = 'bg-[var(--accent)]', className, showLabel = false }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex-1 h-2 rounded-full bg-[var(--border)] overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${pct}%` }} />
      </div>
      {showLabel && <span className="text-[11px] num text-[var(--muted)]">{Math.round(pct)}%</span>}
    </div>
  )
}
