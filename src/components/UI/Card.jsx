import React from 'react'
import { cn } from '../../utils/cn'

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('card p-4 sm:p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-3 mb-4', className)}>
      <div className="min-w-0">
        <h3 className="font-semibold text-base leading-urdu no-clip">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--muted)] mt-1 leading-urdu no-clip">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function CardTitle({ children, className }) {
  return <h3 className={cn('font-semibold leading-urdu no-clip', className)}>{children}</h3>
}

export function CardContent({ children, className }) {
  return <div className={cn(className)}>{children}</div>
}

export default Card
