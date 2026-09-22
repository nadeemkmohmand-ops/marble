import React from 'react'
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
                      'sidebar-link flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-all duration-200 border border-transparent',
                      active
                        ? 'bg-gradient-to-l from-flame-500 to-flame-600 text-white font-semibold shadow-[0_4px_14px_-4px_rgba(249,115,22,0.55)] -translate-y-px'
                        : 'text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--accent)_9%,transparent)] hover:border-[color-mix(in_srgb,var(--accent)_22%,transparent)] hover:translate-x-0.5',
                    )}
                  >
                    <item.icon size={17} className={cn('shrink-0 transition-transform duration-300', active && 'scale-110')} />
                    <span className="truncate leading-urdu no-clip min-w-0">{t(item.key)}</span>
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
  const { open, close } = useSidebar()
  const { lang } = useLang()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[70] no-print">
      {/* Backdrop — click to close, leaving the current page full-screen underneath */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-[fadeIn_.2s_ease]" onClick={close} />

      <aside
        className={cn(
          'absolute top-0 bottom-0 w-72 max-w-[85vw] bg-[var(--card)] border-e border-[var(--border)] flex flex-col shadow-2xl animate-slideUpFade',
          lang === 'ur' ? 'right-0' : 'left-0',
        )}
      >
        <div className="h-16 shrink-0 flex items-center justify-between px-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-flame-400 to-flame-600 grid place-items-center text-white font-bold shadow-[0_4px_12px_-4px_rgba(249,115,22,0.6)]">M</div>
            <div className="min-w-0">
              <div className="font-bold text-sm truncate leading-urdu no-clip">{lang === 'ur' ? APP_INFO.nameUr : APP_INFO.name}</div>
              <div className="text-[10px] text-[var(--muted)] num">v{APP_INFO.version}</div>
            </div>
          </div>
          <button onClick={close} className="btn btn-ghost h-9 w-9 justify-center shrink-0" aria-label="Close menu">
            <X size={18} />
          </button>
        </div>
        <NavItems onNavigate={close} />
      </aside>
    </div>
  )
}
