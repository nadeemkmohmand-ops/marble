import React from 'react'
import { cn } from '../../utils/cn'
import { useLang } from '../../context/LanguageContext'
import { statusTone } from '../../constants/enums'

const TONES = {
  success: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  warning: 'bg-amber-500/12 text-amber-700 dark:text-amber-400 border-amber-500/25',
  danger: 'bg-red-500/12 text-red-700 dark:text-red-400 border-red-500/25',
  info: 'bg-azure-500/12 text-azure-700 dark:text-azure-400 border-azure-500/25',
  brand: 'bg-flame-500/14 text-flame-700 dark:text-flame-400 border-flame-500/30',
  muted: 'bg-marble-500/10 text-marble-600 dark:text-marble-300 border-marble-500/25',
}

/** Status badge — i18n label via enums.*, color via STATUS_TONE. */
export default function Badge({ status, label, tone, className }) {
  const { t } = useLang()
  const text = label ?? t(`enums.status.${status}`)
  const finalTone = tone || statusTone(status)
  return (
    <span className={cn('badge no-clip', TONES[finalTone], className)}>
      {text}
    </span>
  )
}
