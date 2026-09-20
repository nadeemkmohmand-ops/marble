import React from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function SearchInput({ value, onChange, placeholder, className }) {
  return (
    <div className={cn('relative flex-1 min-w-[10rem]', className)}>
      <Search size={15} className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
      <input
        className="input ps-9 pe-8"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute end-2 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--text)]"
          aria-label="Clear"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
