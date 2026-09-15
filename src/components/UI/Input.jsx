import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

/** Field — label + hint wrapper for any form control */
export function Field({ label, hint, required = false, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-sm font-semibold text-main">
          {label}
          {required && <span className="text-error"> *</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

/** Input — text / number / date / search input (Urdu labels come from Field) */
export const Input = forwardRef(function Input({ className = '', ...props }, ref) {
  return <input ref={ref} className={`field-input ${className}`} {...props} />
})

/** Select — native select with a direction-aware chevron (end side) */
export function Select({ className = '', children, ...props }) {
  return (
    <div className={`relative ${className}`}>
      <select className="field-input cursor-pointer appearance-none pe-10" {...props}>
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-light"
        aria-hidden="true"
      />
    </div>
  )
}

/** Switch — visual toggle (UI state only, no logic attached) */
export function Switch({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
        checked ? 'bg-accent' : 'bg-border dark:bg-gray-600'
      }`}
    >
      <span
        className={`absolute h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'start-6' : 'start-1'
        }`}
      />
    </button>
  )
}
