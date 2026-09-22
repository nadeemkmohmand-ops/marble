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
    <div className={cn('flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1', className)} role="tablist">
      {tabs.map((tab, i) => (
        <button
          key={i}
          role="tab"
          aria-selected={current === i}
          onClick={() => set(i)}
          className={cn(
            'btn min-h-9 px-4 text-sm whitespace-nowrap rounded-xl border',
            current === i
              ? 'btn-active-orange text-white border-transparent shadow-[0_4px_14px_-4px_rgba(249,115,22,0.55)]'
              : 'btn-secondary',
          )}
        >
          {tab.icon ? <tab.icon size={15} /> : null}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
