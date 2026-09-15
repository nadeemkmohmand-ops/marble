import { Bell, Gem, Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAppUI } from '../../context/AppUIContext.jsx'
import { useSidebar } from '../../context/SidebarContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import Tooltip from '../UI/Tooltip.jsx'
import UserMenu from './UserMenu.jsx'

/**
 * Header — sticky top bar (deep blue).
 * Hamburger (below lg) opens the sidebar drawer (SidebarContext).
 * Adds a global-search placeholder (hidden on mobile) and a user menu.
 */
export default function Header() {
  const { t } = useAppUI()
  const { openSidebar } = useSidebar()
  const { toast } = useToast()

  return (
    <header className="sticky top-0 z-30 bg-primary text-white shadow-md">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-2 px-4 sm:px-6">
        {/* hamburger — hidden on desktop (sidebar is fixed there) */}
        <button
          type="button"
          onClick={openSidebar}
          className="grid h-11 w-11 place-items-center rounded-xl transition-colors hover:bg-white/10 lg:hidden"
          aria-label={t('common.menu')}
        >
          <Menu size={22} />
        </button>

        {/* brand */}
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/20">
            <Gem size={22} className="text-accent-light" />
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-base font-bold">{t('factoryName')}</p>
            <p className="truncate text-[11px] text-white/60">{t('tagline')}</p>
          </div>
        </div>

        {/* actions */}
        <div className="ms-auto flex items-center gap-1">
          {/* app-wide search — framework placeholder (wire up in a later version) */}
          <Tooltip label={t('header.searchSoon')}>
            <button
              type="button"
              onClick={() => toast({ type: 'info', message: t('header.searchSoon') })}
              className="hidden h-10 w-56 items-center gap-2 rounded-xl bg-white/10 px-3.5 text-start text-xs text-white/70 ring-1 ring-white/20 transition-colors hover:bg-white/15 md:flex"
              aria-label={t('common.search')}
            >
              <Search size={16} aria-hidden="true" />
              <span className="truncate">{t('header.search')}</span>
            </button>
          </Tooltip>

          <Link
            to="/notifications"
            className="relative grid h-11 w-11 place-items-center rounded-xl transition-colors hover:bg-white/10"
            aria-label={t('set.notifications')}
          >
            <Bell size={20} />
            <span
              className="absolute end-2.5 top-2 h-2 w-2 rounded-full bg-accent-light ring-2 ring-primary"
              aria-hidden="true"
            />
          </Link>

          <UserMenu />
        </div>
      </div>
    </header>
  )
}
