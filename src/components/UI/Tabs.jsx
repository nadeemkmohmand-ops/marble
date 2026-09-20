import React, { useState } from 'react'
import { cn } from '../../utils/cn'

export default function Tabs({ tabs, active, onChange, className }) {
  const [local, setLocal] = useState(0)
  const current = active ?? local
  const set = (i) => {
    setLocal(i)
    onChange?.(i)
  }
  return (
    <div className={cn('flex gap-1 overflow-x-auto pb-1 -mx-1 px-1', className)} role="tablist">
      {tabs.map((tab, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={current === i}
          onClick={() => set(i)}
          className={cn(
            'btn min-h-9 px-4 text-sm whitespace-nowrap rounded-xl border',
            current === i
              ? 'bg-[var(--accent)] text-white border-transparent shadow-sm'
              : 'bg-[var(--card)] border-[var(--border)] text-[var(--text)] hover:brightness-105',
          )}
        >
          {tab.icon ? <tab.icon size={15} /> : null}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
