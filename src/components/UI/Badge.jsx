import { cn } from '../../utils/cn.js'

/**
 * Badge — status chip (inventory "کم", order status, counters…).
 * Replaces the inline status pills previously hand-drawn in Inventory/Orders.
 *
 *   <Badge variant="warning" dot>{t('inv.low')}</Badge>
 */
const VARIANTS = {
  success: 'bg-success-light text-success-dark dark:bg-success/15 dark:text-success',
  warning: 'bg-warning-light text-warning-dark dark:bg-warning/15 dark:text-warning',
  error: 'bg-error-light text-error-dark dark:bg-error/15 dark:text-error',
  info: 'bg-primary-50 text-primary dark:bg-primary/25 dark:text-primary-light',
  accent: 'bg-accent-50 text-accent-dark dark:bg-accent/20 dark:text-accent-light',
  neutral: 'bg-secondary text-text-light dark:bg-gray-700 dark:text-gray-300',
}

export default function Badge({ variant = 'neutral', size = 'md', dot = false, children, className = '' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-bold',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        VARIANTS[variant] ?? VARIANTS.neutral,
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
