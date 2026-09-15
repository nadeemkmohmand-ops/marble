/** Spinner — inline loading indicator (sizes in px). */
export default function Spinner({ size = 24, className = '', label }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-primary dark:text-primary-light ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
