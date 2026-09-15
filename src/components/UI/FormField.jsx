import { cloneElement, isValidElement, useId } from 'react'
import { cn } from '../../utils/cn.js'

/**
 * FormField — label + hint + error wrapper around a single form control.
 * Extends the plain Field with error display and automatic a11y wiring
 * (htmlFor / aria-invalid / aria-describedby).
 *
 *   <FormField label={t('common.name')} error={errors?.name} required>
 *     <Input value={name} onChange={…} />
 *   </FormField>
 *
 * NOTE: for <Select> the id lands on the wrapper div (select is nested);
 * pass an explicit id to the control when you need exact targeting.
 */
export default function FormField({ label, hint, error, required = false, children, className = '' }) {
  const fallbackId = useId()
  const controlId = (isValidElement(children) && children.props.id) || `field-${fallbackId}`
  const hintId = `${controlId}-hint`
  const errorId = `${controlId}-error`

  let control = children
  if (isValidElement(children)) {
    control = cloneElement(children, {
      id: controlId,
      'aria-invalid': error ? true : undefined,
      'aria-describedby':
        [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined,
    })
  }

  return (
    <div className={cn('block', className)}>
      {label && (
        <label htmlFor={controlId} className="mb-1.5 block text-sm font-semibold text-main">
          {label}
          {required && <span className="text-error"> *</span>}
        </label>
      )}
      {control}
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-semibold text-error">
          {error}
        </p>
      )}
    </div>
  )
}
