import { cn } from '../../utils/cn.js'

/**
 * Tabs — segmented selector (Reports weekly/monthly/custom, Settings…).
 * Controlled: pass `value` + `onChange`. tabs: [{ id, label, icon? }]
 *
 *   <Tabs tabs={types} value={type} onChange={setType} />
 */
export default function Tabs({ tabs = [], value, onChange, className = '' }) {
  return (
    <div
      role="tablist"
      className={cn('grid gap-1 rounded-xl bg-secondary p-1 dark:bg-gray-700/50', className)}
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(tab.id)}
            className={cn(
              'flex min-h-10 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-colors sm:text-sm',
              active
                ? 'bg-white text-primary shadow-sm dark:bg-gray-800 dark:text-white'
                : 'text-text-light hover:text-text-dark dark:text-gray-400 dark:hover:text-gray-200'
            )}
          >
            {tab.icon && <tab.icon size={16} aria-hidden="true" />}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
