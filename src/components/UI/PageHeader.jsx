/**
 * PageHeader — Urdu page title with the English name in parentheses for
 * development reference (as specified in the design brief).
 */
export default function PageHeader({ title, en, subtitle, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <h1 className="text-xl font-bold text-main sm:text-2xl">{title}</h1>
          {en && (
            <span className="font-english text-xs font-medium text-muted" dir="ltr">
              ({en})
            </span>
          )}
        </div>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
