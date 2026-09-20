import React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export default function Select({ label, options = [], error, className, children, ...props }) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 leading-urdu no-clip">
          {label}
        </label>
      )}
      <div className="relative">
        <select className="input appearance-none pr-8 cursor-pointer" {...props}>
          {props.placeholder !== undefined && <option value="">{props.placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]" />
      </div>
      {error && <p className="text-[11px] text-danger mt-1">{error}</p>}
    </div>
  )
}
