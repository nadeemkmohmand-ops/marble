import { Smartphone, User } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppUI } from '../../context/AppUIContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { useClickOutside } from '../../hooks/useClickOutside.js'
import { useKeyboard } from '../../hooks/useKeyboard.js'
import { promptInstall, usePwaInstall } from '../../utils/pwaInstall.js'

/**
 * UserMenu — avatar + dropdown placeholder in the Header (user identity spot).
 * Items navigate; Log Out only shows a demo toast (no auth logic yet).
 */
export default function UserMenu() {
  const { t } = useAppUI()
  const { toast } = useToast()
  const { canInstall } = usePwaInstall()
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useClickOutside(menuRef, () => setOpen(false), open)
  useKeyboard('Escape', () => setOpen(false), { active: open })

  const items = [
    { icon: User, label: t('menu.profile'), to: '/settings' },
    { icon: null, label: t('nav.settings'), to: '/settings' },
    { icon: null, label: t('nav.about'), to: '/about' },
  ]

  const handleAddToHome = async () => {
    setOpen(false)
    const outcome = await promptInstall()
    if (outcome === 'accepted') {
      toast({ type: 'success', message: t('pwa.installSuccess') })
    } else if (outcome === 'unavailable') {
      // iOS Safari etc. — guide the user to the browser menu
      toast({ type: 'info', message: t('pwa.installManual') })
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('header.account')}
        className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-base font-bold ring-1 ring-white/20 transition-colors hover:bg-white/20"
      >
        م
      </button>

      {/* dropdown — no overflow-hidden: Urdu text must not clip */}
      {open && (
        <div role="menu" className="surface fade-up absolute end-0 top-12 z-50 w-52 p-1.5 shadow-xl">
          <div className="border-b border-border px-3 py-2.5 dark:border-gray-700">
            <p className="text-sm font-bold text-main">{t('set.userName')}</p>
            <p className="text-[11px] text-muted">{t('set.factoryManager')}</p>
          </div>

          {items.map(({ icon: Icon, label, to }) => (
            <Link
              key={`${label}-${to}`}
              role="menuitem"
              to={to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-main transition-colors hover:bg-secondary dark:hover:bg-gray-700"
            >
              {Icon && <Icon size={16} aria-hidden="true" />}
              {label}
            </Link>
          ))}

          {/* Add to Home Screen — triggers the native install prompt
              (captured globally in utils/pwaInstall.js) */}
          {canInstall && (
            <button
              type="button"
              role="menuitem"
              onClick={handleAddToHome}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-secondary dark:text-primary-light dark:hover:bg-gray-700"
            >
              <Smartphone size={16} aria-hidden="true" />
              {t('pwa.addToHome')}
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              toast({ type: 'info', message: t('toast.demoLogout') })
            }}
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-error transition-colors hover:bg-error/10"
          >
            {t('set.logout')}
          </button>
        </div>
      )}
    </div>
  )
}
