import React, { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'
import { useClickOutside } from '../../hooks/useClickOutside'
import { useLang } from '../../context/LanguageContext'

/**
 * Select — fully custom dropdown (NOT a native <select>).
 *
 * Native <select> popups are rendered by the OS on mobile (Android/
 * iOS), which ignores the page's font-family — so Noto Nastaliq Urdu
 * falls back to a system font in the popup and glyphs render broken/
 * disconnected even though the closed control looks fine. Building
 * our own popup means every letter always uses the app's own fonts.
 *
 * Stays drop-in compatible with every existing call site: same
 * props (label, value, onChange, options, placeholder, error, hint,
 * disabled, id, className) and onChange still receives an event-like
 * object with `.target.value`, exactly like a native <select>.
 */
export default function Select({
  label,
  options = [],
  value,
  onChange,
  placeholder,
  error,
  hint,
  disabled,
  className,
  id,
  required,
  'aria-invalid': ariaInvalid,
  'aria-describedby': ariaDescribedby,
}) {
  const { lang } = useLang()
  const fallbackId = useId()
  const controlId = id || `sel-${fallbackId}`
  const listId = `${controlId}-list`
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const rootRef = useRef(null)
  const listRef = useRef(null)

  const allOptions = placeholder !== undefined ? [{ value: '', label: placeholder }, ...options] : options
  const selected = allOptions.find((o) => String(o.value) === String(value))

  useClickOutside(rootRef, () => setOpen(false), open)

  useEffect(() => {
    if (!open) return
    const idx = allOptions.findIndex((o) => String(o.value) === String(value))
    setActiveIndex(idx >= 0 ? idx : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open || activeIndex < 0) return
    const el = listRef.current?.children?.[activeIndex]
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex])

  const emit = (v) => onChange?.({ target: { value: v } })

  const pick = (opt) => {
    emit(opt.value)
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (disabled) return
    if (!open) {
      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(e.key)) {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, allOptions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(allOptions.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      if (allOptions[activeIndex]) pick(allOptions[activeIndex])
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={cn('w-full', className)} ref={rootRef}>
      {label && (
        <label htmlFor={controlId} className="block text-xs font-medium text-[var(--muted)] mb-1.5 leading-urdu no-clip">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={controlId}
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listId}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
          disabled={disabled}
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onKeyDown}
          dir={lang === 'ur' ? 'rtl' : 'ltr'}
          className={cn(
            'input flex items-center justify-between gap-2 text-start',
            'appearance-none pe-8 cursor-pointer select-none',
            disabled && 'opacity-60 cursor-not-allowed',
            error && 'border-danger',
          )}
        >
          <span className={cn('truncate leading-urdu no-clip', !selected && 'text-[var(--muted)]')}>
            {selected ? selected.label : (placeholder ?? '')}
          </span>
        </button>
        <ChevronDown size={14} className="absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--muted)]" />

        {open && (
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            dir={lang === 'ur' ? 'rtl' : 'ltr'}
            tabIndex={-1}
            className="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto card p-1 shadow-xl fade-in"
          >
            {allOptions.length === 0 && (
              <li className="px-3 py-2 text-xs text-[var(--muted)] leading-urdu no-clip">—</li>
            )}
            {allOptions.map((opt, i) => {
              const isSelected = String(opt.value) === String(value)
              return (
                <li
                  key={`${opt.value}-${i}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => pick(opt)}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm cursor-pointer leading-urdu no-clip min-h-10',
                    i === activeIndex && 'bg-[var(--accent)]/15',
                    isSelected && 'font-semibold',
                    opt.value === '' && 'text-[var(--muted)]',
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check size={14} className="shrink-0 text-[var(--accent)]" />}
                </li>
              )
            })}
          </ul>
        )}
      </div>
      {hint && !error && <p className="text-[11px] text-[var(--muted)] mt-1 leading-urdu no-clip">{hint}</p>}
      {error && <p className="text-[11px] text-danger mt-1 leading-urdu no-clip">{error}</p>}
    </div>
  )
}
