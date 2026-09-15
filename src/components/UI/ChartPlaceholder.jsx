/**
 * ChartPlaceholder — pure CSS charts with static data (no chart library).
 *  - variant="bar":   column chart with grid lines, hover highlight, value labels
 *  - variant="donut": conic-gradient donut with center label + legend
 * The RTL flex row orders bars right-to-left, which matches Urdu reading order.
 */
export default function ChartPlaceholder({
  data = [],
  variant = 'bar',
  height = 'h-44',
  centerValue,
  centerLabel,
}) {
  const max = Math.max(...data.map((d) => d.value), 1)

  /* ---------- Donut ---------- */
  if (variant === 'donut') {
    const total = data.reduce((sum, d) => sum + d.value, 0)
    let accumulated = 0
    const stops = data
      .map((d) => {
        const start = (accumulated / total) * 100
        accumulated += d.value
        const end = (accumulated / total) * 100
        return `${d.color} ${start}% ${end}%`
      })
      .join(', ')

    return (
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center sm:gap-10">
        <div className="relative h-40 w-40 shrink-0">
          <div
            className="h-full w-full rounded-full shadow-inner"
            style={{ background: `conic-gradient(${stops})` }}
            role="img"
            aria-label="donut chart"
          />
          <div className="absolute inset-[22%] grid place-items-center rounded-full bg-white dark:bg-gray-800">
            <div className="text-center">
              <p className="font-english text-xl font-bold text-main">{centerValue ?? total}</p>
              <p className="urdu-text text-[10px] text-muted">{centerLabel}</p>
            </div>
          </div>
        </div>

        <ul className="w-full max-w-xs space-y-2.5">
          {data.map((d, index) => (
            <li key={index} className="flex items-center gap-2.5 text-sm">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: d.color }} aria-hidden="true" />
              <span className="min-w-0 flex-1 text-main">{d.label}</span>
              <span className="font-english font-semibold text-muted">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  /* ---------- Bars ---------- */
  return (
    <div>
      <div className={`relative ${height}`}>
        {/* horizontal grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden="true">
          {[0, 1, 2, 3].map((line) => (
            <div key={line} className="border-t border-dashed border-border/80 dark:border-gray-700" />
          ))}
        </div>

        {/* columns */}
        <div className="relative flex h-full items-end justify-between gap-1.5 sm:gap-3">
          {data.map((d, index) => (
            <div key={index} className="group flex h-full flex-1 flex-col items-center gap-1">
              <span className="hidden font-english text-[10px] font-semibold text-muted sm:block">{d.value}</span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md bg-gradient-to-t from-primary to-primary-light transition-all duration-300 group-hover:from-accent group-hover:to-accent-light"
                  style={{ height: `${Math.max((d.value / max) * 100, 4)}%` }}
                  title={`${d.label}: ${d.value}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* x-axis labels (aligned with the columns above) */}
      <div className="mt-2 flex justify-between gap-1.5 sm:gap-3">
        {data.map((d, index) => (
          <span
            key={index}
            className="flex-1 text-center text-[10px] text-muted sm:text-xs"
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  )
}
