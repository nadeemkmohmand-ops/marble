import React from 'react'
import { cn } from '../../utils/cn'
import { Loader2 } from 'lucide-react'

/* All variants rest in their own hue and share the orange pressed
   state defined on `.btn:active` in index.css. */
const VARIANTS = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  success: 'btn-success',
  whatsapp: 'btn-whatsapp',
  info: 'btn-info',
  teal: 'btn-teal',
}

const SIZES = {
  sm: 'min-h-8 px-3 text-xs',
  md: 'min-h-10 px-4 text-sm',
  lg: 'min-h-12 px-5 text-base',
  icon: 'h-10 w-10 !px-0 justify-center',
}

export default function Button({
  as: Tag = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className,
  children,
  ...props
}) {
  return (
    <Tag
      className={cn('btn', VARIANTS[variant], SIZES[size], disabled && 'opacity-50 pointer-events-none', className)}
      disabled={Tag === 'button' ? disabled || loading : undefined}
      {...props}
    >
      {loading ? <Loader2 size={16} className="animate-spin" /> : Icon ? <Icon size={16} /> : null}
      {children}
    </Tag>
  )
}
