import React from 'react'

/** Accessible toggle switch row. Checked state uses the orange accent. */
export default function Toggle({ label, checked, onChange, description }) {
  return (
    <label className="flex items-center justify-between gap-3 cursor-pointer select-none min-h-11">
      <span className="min-w-0">
        <span className="block text-sm leading-urdu no-clip">{label}</span>
        {description && <span className="block text-[11px] text-[var(--muted)] leading-urdu no-clip">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-all duration-300 ${
          checked
            ? 'bg-gradient-to-r from-flame-400 to-flame-600 shadow-[0_2px_10px_-2px_rgba(249,115,22,0.6)]'
            : 'bg-[var(--border)] hover:bg-[color-mix(in_srgb,var(--accent)_25%,var(--border))]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-300 ${
            checked ? 'start-[1.375rem] scale-105' : 'start-0.5'
          }`}
        />
      </button>
    </label>
  )
}
