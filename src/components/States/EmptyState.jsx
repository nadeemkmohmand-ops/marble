import React from 'react'
import { PackageOpen } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

export default function EmptyState({ icon: Icon = PackageOpen, title, hint }) {
  const { t } = useLang()
  return (
    <div className="py-14 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] border border-[color-mix(in_srgb,var(--accent)_20%,transparent)] grid place-items-center text-[var(--accent)]">
        <Icon size={24} />
      </div>
      <p className="mt-3 text-sm font-medium leading-urdu no-clip">{title || t('common.noData')}</p>
      {hint && <p className="text-xs text-[var(--muted)] mt-1 leading-urdu no-clip">{hint}</p>}
    </div>
  )
}
