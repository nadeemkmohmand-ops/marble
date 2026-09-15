import { cn } from '../../utils/cn.js'

/**
 * RadioGroup — styled native radios.
 * options: [{ value, label }]
 *   <RadioGroup name="report" options={opts} value={v} onChange={setV} />
 */
export function RadioGroup({ name, options = [], value, onChange, label, className = '' }) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('space-y-2', className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <label key={option.value} className="flex cursor-pointer items-center gap-3">
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={selected}
              onChange={() => onChange?.(option.value)}
              className="h-5 w-5 shrink-0 cursor-pointer accent-accent focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:outline-none"
            />
            <span className={cn('text-sm', selected ? 'font-bold text-main' : 'text-muted')}>
              {option.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

export default RadioGroup
