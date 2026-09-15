import { forwardRef } from 'react'

const VARIANTS = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-light focus-visible:ring-primary/50',
  accent: 'bg-accent text-white shadow-sm hover:bg-accent-light focus-visible:ring-accent/50',
  secondary:
    'bg-secondary text-text-dark hover:bg-secondary-dark focus-visible:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  outline:
    'border border-border bg-white text-text-dark hover:bg-secondary focus-visible:ring-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
  ghost: 'text-text-dark hover:bg-secondary focus-visible:ring-gray-400 dark:text-gray-200 dark:hover:bg-gray-700',
  danger: 'bg-error text-white shadow-sm hover:bg-red-600 focus-visible:ring-error/50',
}

const SIZES = {
  sm: 'h-9 px-3 text-xs gap-1.5',
  md: 'h-11 px-5 text-sm gap-2', // 44px — touch friendly
  lg: 'h-12 px-6 text-base gap-2',
  icon: 'h-11 w-11',
}

/**
 * Button — pass `as={Link}` and `to="/path"` to render a router link as a button.
 */
const Button = forwardRef(function Button(
  { as: Component = 'button', variant = 'primary', size = 'md', type = 'button', className = '', ...props },
  ref
) {
  return (
    <Component
      ref={ref}
      type={Component === 'button' ? type : undefined}
      className={`inline-flex select-none items-center justify-center whitespace-nowrap rounded-xl font-semibold leading-6 transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  )
})

export default Button
