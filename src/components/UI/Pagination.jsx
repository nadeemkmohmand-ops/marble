import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { cn } from '../../utils/cn.js'

/** 5-button sliding window around the current page. */
function pageWindow(page, pageCount, size = 5) {
  const start = Math.max(1, Math.min(page - Math.floor(size / 2), pageCount - size + 1))
  const end = Math.min(pageCount, start + size - 1)
  const pages = []
  for (let p = start; p <= end; p += 1) pages.push(p)
  return pages
}

/**
 * Pagination — RTL-aware pager for tables/lists.
 * Controlled: page + pageCount + onChange. Renders nothing when pageCount ≤ 1.
 * Current page uses the persistent orange active state.
 */
export default function Pagination({ page = 1, pageCount = 1, onChange, className = '' }) {
  const { t, isRTL } = useLanguage()
  if (pageCount <= 1) return null

  const PrevIcon = isRTL ? ChevronRight : ChevronLeft
  const NextIcon = isRTL ? ChevronLeft : ChevronRight

  return (
    <nav className={cn('flex items-center justify-center gap-1', className)} aria-label="pagination">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onChange?.(page - 1)}
        className="icon-btn disabled:pointer-events-none disabled:opacity-40"
        aria-label={t('common.previous')}
      >
        <PrevIcon size={18} />
      </button>
      {pageWindow(page, pageCount).map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onChange?.(p)}
          aria-current={p === page ? 'page' : undefined}
          className={cn(
            'btn grid h-9 w-9 place-items-center rounded-lg font-english text-sm font-bold',
            p === page
              ? 'btn-active-orange border border-transparent shadow-[0_4px_14px_-4px_rgba(249,115,22,0.55)] !px-0'
              : 'btn-ghost border border-[var(--border)] !px-0 hover:border-flame-300',
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        disabled={page >= pageCount}
        onClick={() => onChange?.(page + 1)}
        className="icon-btn disabled:pointer-events-none disabled:opacity-40"
        aria-label={t('common.next')}
      >
        <NextIcon size={18} />
      </button>
    </nav>
  )
}
