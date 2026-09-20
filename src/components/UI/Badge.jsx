import React from 'react'
import { cn } from '../../utils/cn'
import { useLang } from '../../context/LanguageContext'
import { statusTone } from '../../constants/enums'

const TONES = {
  success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  warning: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  danger: 'bg-red-500/15 text-red-600 dark:text-red-400',
  info: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
  brand: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  muted: 'bg-slate-500/15 text-slate-500 dark:text-slate-400',
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
