import React from 'react'
import { cn } from '../../utils/cn'

/**
 * RTL-safe table — Cream Editorial redesign.
 *
 * Visual system (see .data-table in index.css):
 *  - Header: warm gradient band (orange → blue tint) with rounded ends
 *    and a signature accent hairline on its bottom edge.
 *  - Rows: soft rounded "card rows" on the cream surface; the first cell
 *    carries a tiny vertical gradient tick that scales in on hover.
 *  - Hover: warm orange tint + glowing borders (desktop); clickable rows
 *    also get a gentle lift via the row transition.
 *
 * Urdu/Nastaliq safety rules are preserved: no fixed heights, generous
 * leading (`leading-urdu`), `.no-clip` so glyph chains are never cut,
 * and `unicode-bidi: plaintext` comes from the global th/td rules.
 */
export function Table({ columns, rows, keyOf = (r) => r.id, empty, onRowClick, className }) {
  return (
    <div className={cn('overflow-x-auto -mx-1 px-1', className)}>
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="leading-urdu no-clip">
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
              className={cn('data-row', onRowClick && 'cursor-pointer')}
            >
              {columns.map((col) => (
                <td key={col.key} className="leading-urdu no-clip">
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
