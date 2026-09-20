import React, { useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { NAV_GROUPS } from '../../constants/navigation'
import { useSidebar } from '../../context/SidebarContext'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import APP_INFO from '../../constants/appInfo'

function NavItems({ onNavigate }) {
  const { t } = useLang()
  const { user, canSee } = useAuth()
  const location = useLocation()

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
      {NAV_GROUPS.filter((g) => g.items.some((i) => canSee(i.roles))).map((group) => (
        <div key={group.id}>
          <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] leading-urdu no-clip">
            {t(`nav.groups.${group.id}`)}
          </div>
          <div className="space-y-0.5">
            {group.items
              .filter((item) => canSee(item.roles))
              .map((item) => {
                const active = location.pathname === item.to
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    className={cn(
                      'sidebar-link flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition',
                      active
                        ? 'bg-[var(--accent)] text-white font-semibold shadow-sm'
                        : 'text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--border)_45%,transparent)]',
                    )}
                  >
                    <item.icon size={17} className="shrink-0" />
                    <span className="truncate leading-urdu no-clip">{t(item.key)}</span>
                  </NavLink>
                )
              })}
          </div>
        </div>
      ))}
    </nav>
  )
}

export default function Sidebar() {
  const { open, mobileOpen, closeMobile } = useSidebar()
  const { lang } = useLang()

  return (
    <>
      {/* Desktop */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed inset-y-0 bg-[var(--card)] border-e border-[var(--border)] transition-all duration-200 z-30 no-print',
          open ? 'w-64' : 'w-[76px]',
        )}
      >
        <div className="h-16 flex items-center gap-2.5 px-4 border-b border-[var(--border)]">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-[var(--accent)] grid place-items-center text-white font-bold">M</div>
          {open && (
            <div className="min-w-0">
              <div className="font-bold text-sm leading-urdu no-clip">{lang === 'ur' ? APP_INFO.nameUr : APP_INFO.name}</div>
              <div className="text-[10px] text-[var(--muted)] num">v{APP_INFO.version}</div>
            </div>
          )}
        </div>
        <NavItems />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-[70] no-print">
          <div className="absolute inset-0 bg-black/50" onClick={closeMobile} />
          <aside
            className={cn(
              'absolute top-0 bottom-0 w-72 bg-[var(--card)] border-e border-[var(--border)] flex flex-col fade-in',
              lang === 'ur' ? 'right-0' : 'left-0',
            )}
          >
            <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-[var(--accent)] grid place-items-center text-white font-bold">M</div>
                <div className="font-bold text-sm">{lang === 'ur' ? APP_INFO.nameUr : APP_INFO.name}</div>
              </div>
              <button onClick={closeMobile} className="btn btn-ghost h-9 w-9 justify-center" aria-label="Close menu">
                <X size={18} />
              </button>
            </div>
            <NavItems onNavigate={closeMobile} />
          </aside>
        </div>
      )}
    </>
  )
}
