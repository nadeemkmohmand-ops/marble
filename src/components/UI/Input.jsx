import React from 'react'
import { cn } from '../../utils/cn'

export default function Input({ label, error, hint, type = 'text', className, id, ...props }) {
  const inputId = id || `in-${label || props.name || Math.random().toString(36).slice(2, 7)}`
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-[var(--muted)] mb-1.5 leading-urdu no-clip">
          {label}
        </label>
      )}
      <input id={inputId} type={type} className={cn('input num', error && 'border-danger')} {...props} />
      {hint && !error && <p className="text-[11px] text-[var(--muted)] mt-1 leading-urdu no-clip">{hint}</p>}
      {error && <p className="text-[11px] text-danger mt-1 leading-urdu no-clip">{error}</p>}
    </div>
  )
}
