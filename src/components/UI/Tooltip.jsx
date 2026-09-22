import { cn } from '../../utils/cn.js'

/**
 * Tooltip — CSS-only tooltip on hover + keyboard focus (no JS positioning).
 *   <Tooltip label="حذف کریں"><button className="icon-btn">…</button></Tooltip>
 */
export default function Tooltip({ label, side = 'top', children, className = '' }) {
  const position = side === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'
  return (
    <span className={cn('group/tt relative inline-flex', className)}>
      {children}
      <span
        role="tooltip"
        className={cn(
          'pointer-events-none absolute left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gradient-to-br from-violet-600 to-indigo-700 px-2.5 py-1.5 text-[11px] font-semibold text-white opacity-0 shadow-[0_4px_14px_-4px_rgba(124,58,237,0.6)] transition-opacity duration-200 group-focus-within/tt:opacity-100 group-hover/tt:opacity-100',
          position
        )}
      >
        {label}
      </span>
    </span>
  )
}
