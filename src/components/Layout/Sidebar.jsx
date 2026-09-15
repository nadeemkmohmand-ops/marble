import { NavLink } from 'react-router-dom'
import {
  BarChart3,
  Bell,
  Boxes,
  Calculator,
  ClipboardList,
  Gem,
  HardHat,
  Home,
  Info,
  Printer,
  Settings,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useAppUI } from '../../context/AppUIContext.jsx'
import { useSidebar } from '../../context/SidebarContext.jsx'
import { PATHS } from '../../constants/routes.js'

/**
 * Sidebar — fixed on the start side (right in RTL, left in English/LTR).
 *  - mobile  (<768px):  hidden drawer, opened by the header hamburger
 *  - desktop (≥1024px): always visible, content is padded via lg:ps-72 in Layout
 * Items are grouped into sections; open/close state lives in SidebarContext.
 */
export default function Sidebar() {
  const { t, isRTL } = useAppUI()
  const { open, closeSidebar } = useSidebar()

  const sections = [
    {
      label: t('nav.sectionMain'),
      items: [
        { to: PATHS.HOME, label: t('nav.home'), icon: Home },
        { to: PATHS.CALCULATOR, label: t('nav.calculator'), icon: Calculator },
        { to: PATHS.INVENTORY, label: t('nav.inventory'), icon: Boxes },
        { to: PATHS.ORDERS, label: t('nav.orders'), icon: ClipboardList },
        { to: PATHS.REPORTS, label: t('nav.reports'), icon: BarChart3 },
      ],
    },
    {
      label: t('nav.sectionManage'),
      items: [
        { to: PATHS.CUSTOMERS, label: t('nav.customers'), icon: Users },
        { to: PATHS.WORKERS, label: t('nav.workers'), icon: HardHat },
        { to: PATHS.EXPENSES, label: t('nav.expenses'), icon: Wallet },
        { to: PATHS.NOTIFICATIONS, label: t('nav.notifications'), icon: Bell },
      ],
    },
    {
      label: t('nav.sectionSystem'),
      items: [
        { to: PATHS.PRINT_PREVIEW, label: t('nav.printPreview'), icon: Printer },
        { to: PATHS.ABOUT, label: t('nav.about'), icon: Info },
        { to: PATHS.SETTINGS, label: t('nav.settings'), icon: Settings },
      ],
    },
  ]

  // Direction-aware slide-out: off-screen toward the sidebar's own edge
  const hiddenTranslate = isRTL ? 'translate-x-full' : '-translate-x-full'

  return (
    <>
      {/* dark overlay while the drawer is open (below lg) */}
      <div
        className={`fixed inset-0 z-40 bg-gray-900/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 start-0 z-50 flex w-72 max-w-[85vw] transform flex-col bg-primary-dark text-white shadow-2xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0' : hiddenTranslate
        }`}
        aria-label={t('common.menu')}
      >
        {/* brand */}
        <div className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white">
            <Gem size={24} className="text-primary" />
          </span>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-base font-bold">{t('appName')}</p>
            <p className="truncate text-[11px] text-white/50">{t('location')}</p>
          </div>
          <button
            type="button"
            onClick={closeSidebar}
            className="grid h-9 w-9 place-items-center rounded-lg text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label={t('common.close')}
          >
            <X size={18} />
          </button>
        </div>

        {/* navigation — grouped sections */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-4">
          {sections.map((section) => (
            <div key={section.label}>
              <p className="px-3.5 pb-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40">
                {section.label}
              </p>
              <div className="space-y-1">
                {section.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      `flex min-h-11 items-center gap-3 rounded-xl px-3.5 py-2 text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-accent text-white shadow-md'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`
                    }
                  >
                    <Icon size={20} className="shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* footer */}
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] leading-relaxed text-white/50">
            {t('version')} — {t('appShortName')}
          </p>
        </div>
      </aside>
    </>
  )
}
