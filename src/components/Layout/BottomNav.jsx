import { NavLink } from 'react-router-dom'
import { BarChart3, Boxes, Calculator, Home, Settings } from 'lucide-react'
import { useAppUI } from '../../context/AppUIContext.jsx'
import { PATHS } from '../../constants/routes.js'

/**
 * BottomNav — mobile only (<768px). Five items, 56px rows (touch friendly),
 * safe-area padding for iOS home indicator. Hidden from tablet upwards,
 * where the collapsible sidebar takes over.
 */
export default function BottomNav() {
  const { t } = useAppUI()

  const items = [
    { to: PATHS.HOME, label: t('nav.home'), icon: Home },
    { to: PATHS.CALCULATOR, label: t('nav.calculator'), icon: Calculator },
    { to: PATHS.INVENTORY, label: t('nav.inventory'), icon: Boxes },
    { to: PATHS.REPORTS, label: t('nav.reports'), icon: BarChart3 },
    { to: PATHS.SETTINGS, label: t('nav.settings'), icon: Settings },
  ]

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-white/95 pb-safe backdrop-blur dark:border-gray-700 dark:bg-gray-800/95 md:hidden"
      aria-label={t('common.menu')}
    >
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex min-h-14 flex-col items-center justify-center gap-1 px-1 pb-1 pt-1.5 ${
                isActive ? 'text-accent-dark dark:text-accent-light' : 'text-text-light dark:text-gray-400'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span className={isActive ? 'font-bold' : 'font-medium'}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
