import React from 'react'
import { cn } from '../../utils/cn'

/**
 * RTL-safe table. Rows use min-height & loose leading so Nastaliq
 * Urdu is never clipped. On small screens wrap in overflow-x-auto.
 */
export function Table({ columns, rows, keyOf = (r) => r.id, empty, onRowClick, className }) {
  return (
    <div className={cn('overflow-x-auto -mx-1 px-1', className)}>
      <table className="w-full text-sm border-separate" style={{ borderSpacing: '0 6px' }}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-start text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)] px-3 pb-1 leading-urdu no-clip whitespace-nowrap"
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={keyOf(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'bg-[var(--card)] [&>td]:border-y [&>td]:border-[var(--border)] [&>td:first-child]:border-s [&>td:first-child]:rounded-s-xl [&>td:last-child]:border-e [&>td:last-child]:rounded-e-xl',
                onRowClick && 'cursor-pointer hover:brightness-105',
              )}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 align-middle min-h-[2.6rem] leading-urdu no-clip">
                  {col.render ? col.render(row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length === 0 && empty}
    </div>
  )
}

/** Column helper */
export const col = (key, label, render) => ({ key, label, render })

export default Table
