import React from 'react'
import { cn } from '../../utils/cn'

/** Page toolbar: title + description + action buttons + search/filters. */
export default function Toolbar({ title, description, actions, filters, className }) {
  return (
    <div className={cn('mb-4 space-y-3', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold leading-urdu-lg no-clip">{title}</h1>
          {description && (
            <p className="text-xs text-[var(--muted)] mt-0.5 leading-urdu no-clip">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2 no-print">{actions}</div>}
      </div>
      {filters && <div className="flex flex-wrap items-center gap-2 no-print">{filters}</div>}
    </div>
  )
}
