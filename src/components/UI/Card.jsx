/**
 * Card — white "marble" surface with optional title / subtitle / action header.
 * NOTE: no overflow-hidden and no truncate here — Noto Nastaliq Urdu glyphs are
 * tall and diagonally stacked, so clipping containers cut off letter tops/tails.
 * Urdu text wraps freely and the card self-sizes (min-height, height: auto).
 */
export default function Card({ title, subtitle, action, children, className = '', bodyClassName = '' }) {
  const hasHeader = Boolean(title || subtitle || action)
  return (
    <section className={`surface ${className}`}>
      {hasHeader && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3.5 dark:border-gray-700 sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-bold text-main">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={`px-4 py-4 dark:border-gray-700 sm:px-5 sm:py-5 ${bodyClassName}`}>{children}</div>
    </section>
  )
}
