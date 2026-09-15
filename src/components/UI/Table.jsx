/**
 * Table — RTL table with horizontal scroll on small screens.
 * columns: [{ key, header, className?, render?(row) }]
 * rows: array of objects (static placeholder data)
 */
export default function Table({ columns, rows }) {
  return (
    <div className="surface overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/70 text-xs text-muted dark:border-gray-700 dark:bg-gray-700/40">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`whitespace-nowrap px-4 py-3 text-start font-semibold ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-gray-700">
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id ?? rowIndex}
                className="transition-colors hover:bg-secondary/50 dark:hover:bg-gray-700/30"
              >
                {columns.map((col) => (
                  <td key={col.key} className={`whitespace-nowrap px-4 py-3 text-main ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
