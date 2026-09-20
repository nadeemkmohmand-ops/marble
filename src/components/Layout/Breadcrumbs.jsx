import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'
import { NAV_GROUPS } from '../../constants/navigation'
import { cn } from '../../utils/cn'

export default function Breadcrumbs({ className }) {
  const { t } = useLang()
  const location = useLocation()
  const current = NAV_GROUPS.flatMap((g) => g.items).find((i) => i.to === location.pathname)

  return (
    <nav className={cn('flex items-center gap-1 text-sm min-w-0', className)} aria-label="Breadcrumb">
      <Link to="/" className="text-[var(--muted)] hover:text-[var(--text)] leading-urdu no-clip">
        {t('nav.home')}
      </Link>
      {current && current.to !== '/' && (
        <>
          <ChevronRight size={13} className="text-[var(--muted)] flip-rtl" />
          <span className="font-medium truncate leading-urdu no-clip">{t(current.key)}</span>
        </>
      )}
    </nav>
  )
}
