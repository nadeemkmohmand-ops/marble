import React from 'react'
import { NavLink } from 'react-router-dom'
import { BOTTOM_NAV_ITEMS } from '../../constants/navigation'
import { useLang } from '../../context/LanguageContext'
import { cn } from '../../utils/cn'

export default function BottomNav() {
  const { t } = useLang()
  return (
    <nav className="bottom-nav lg:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--card)] border-t border-[var(--border)] safe-bottom no-print">
      <div className="flex">
        {BOTTOM_NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] min-h-[3.4rem] justify-center',
                isActive ? 'text-[var(--accent)] font-semibold' : 'text-[var(--muted)]',
              )
            }
          >
            <item.icon size={19} />
            <span className="leading-urdu no-clip">{t(item.key)}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
