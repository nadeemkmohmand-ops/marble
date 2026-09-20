import React from 'react'
import { cn } from '../../utils/cn'

export default function Textarea({ label, rows = 3, className, ...props }) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-xs font-medium text-[var(--muted)] mb-1.5 leading-urdu no-clip">
          {label}
        </label>
      )}
      <textarea rows={rows} className={cn('input resize-y', className)} {...props} />
    </div>
  )
}
