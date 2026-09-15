import { forwardRef } from 'react'

/** Textarea — multi-line input sharing the .field-input style. */
export const Textarea = forwardRef(function Textarea({ className = '', rows = 4, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={`field-input min-h-24 resize-y ${className}`} {...props} />
})

export default Textarea
