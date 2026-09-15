import { cn } from '../../utils/cn.js'

/**
 * Checkbox — native input styled with accent-color (keyboard accessible).
 *   <Checkbox label={t('login.remember')} checked={v} onChange={setV} />
 */
export function Checkbox({ label, description, checked, onChange, className = '' }) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-3', className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded-md accent-accent focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
      />
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-main">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
    </label>
  )
}

export default Checkbox
