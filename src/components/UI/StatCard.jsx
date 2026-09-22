import React from 'react'
import { cn } from '../../utils/cn'
import { useLang } from '../../context/LanguageContext'

/** KPI card with optional trend / icon. Hover = gentle 3D lift. */
export default function StatCard({ label, value, sub, icon: Icon, tone = 'info', onClick, className }) {
  const { fmtNum } = useLang()
  const tones = {
    info: 'bg-azure-500/12 text-azure-600 dark:text-azure-400',
    success: 'bg-emerald-500/12 text-emerald-600 dark:text-emerald-400',
    warning: 'bg-amber-500/12 text-amber-600 dark:text-amber-400',
    danger: 'bg-red-500/12 text-red-600 dark:text-red-400',
    brand: 'bg-flame-500/14 text-flame-600 dark:text-flame-400',
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn('card card-hover p-4 text-start flex items-center gap-3 w-full', !onClick && 'cursor-default', className)}
    >
      {Icon && (
        <div
          className={cn(
            'h-11 w-11 shrink-0 rounded-xl grid place-items-center transition-transform duration-300 group-hover:scale-105',
            tones[tone],
          )}
        >
          <Icon size={20} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11px] font-medium text-[var(--muted)] leading-urdu no-clip">{label}</div>
        <div className="text-lg font-bold num leading-tight no-clip">{typeof value === 'number' ? fmtNum(value) : value}</div>
        {sub && <div className="text-[11px] text-[var(--muted)] no-clip leading-urdu">{sub}</div>}
      </div>
    </button>
  )
}
