import React from 'react'
import { cn } from '../../utils/cn'
import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'btn-primary shadow-sm hover:brightness-110',
  secondary: 'border border-[var(--border)] bg-[var(--card)] hover:bg-[color-mix(in_srgb,var(--border)_35%,transparent)]',
  ghost: 'btn-ghost',
  danger: 'bg-danger text-white hover:brightness-110',
  success: 'bg-success text-white hover:brightness-110',
  whatsapp: 'bg-[#25D366] text-white hover:brightness-105',
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
