import React from 'react'
import { NavLink } from 'react-router-dom'
import { BOTTOM_NAV_ITEMS } from '../../constants/navigation'
import { useLang } from '../../context/LanguageContext'
import { cn } from '../../utils/cn'

export default function BottomNav() {
  const { t } = useLang()
  return (
    <nav className="bottom-nav lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--card)]/95 backdrop-blur-xl border-t border-[var(--border)] safe-bottom no-print">
      {/* Signature gradient hairline on top of the nav bar */}
      <div className="h-[2px] w-full bg-gradient-to-r from-flame-500 via-azure-400 to-flame-500 opacity-60" aria-hidden="true" />
      <div className="flex">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'relative flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] min-h-[3.4rem] justify-center transition-colors duration-200',
                isActive ? 'text-flame-600 dark:text-flame-400 font-semibold' : 'text-[var(--muted)] active:text-flame-500',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-gradient-to-r from-flame-400 to-flame-600 shadow-[0_0_8px_rgba(249,115,22,0.7)]"
                    aria-hidden="true"
                  />
                )}
                <item.icon size={19} className={cn('transition-transform duration-300', isActive && 'scale-110 -translate-y-px')} />
                <span className="leading-urdu no-clip">{t(item.key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
