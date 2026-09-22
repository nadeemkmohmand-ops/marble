import React from 'react'
import { Menu, Sun, Moon, Languages, Wifi, WifiOff, RefreshCw } from 'lucide-react'
import { useSidebar } from '../../context/SidebarContext'
import { useTheme } from '../../context/ThemeContext'
import { useLang } from '../../context/LanguageContext'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { onSyncStatus } from '../../services/sync'
import Breadcrumbs from './Breadcrumbs'
import { cn } from '../../utils/cn'

export default function Header() {
  const { toggle: toggleSidebar } = useSidebar()
  const { theme, toggle } = useTheme()
  const { toggleLang, lang, t } = useLang()
  const online = useOnlineStatus()

  return (
    <header className="app-header sticky top-0 z-40 h-16 flex items-center gap-2 px-3 sm:px-5 bg-[var(--card)]/85 backdrop-blur-xl border-b border-[var(--border)] shadow-[0_1px_12px_-6px_rgba(60,54,43,0.18)] no-print">
      <button className="btn btn-ghost h-10 w-10 justify-center" onClick={toggleSidebar} aria-label="Menu">
        <Menu size={20} />
      </button>
      <Breadcrumbs className="hidden sm:block flex-1 min-w-0" />
      <div className="flex-1 sm:hidden" />

      <div className="flex items-center gap-1.5">
        <SyncDot />
        <span
          className={cn('hidden sm:flex items-center gap-1 text-[11px] px-2 py-1 rounded-full', online ? 'text-emerald-500' : 'text-amber-500')}
          title={online ? t('common.online') : t('common.offline')}
        >
          {online ? <Wifi size={13} /> : <WifiOff size={13} />}
        </span>
        <button className="btn btn-ghost h-10 w-10 justify-center" onClick={toggleLang} title={t('settings.language')} aria-label="Language">
          <Languages size={18} />
          <span className="text-[10px] font-bold ms-0.5">{lang === 'ur' ? 'EN' : 'UR'}</span>
        </button>
        <button className="btn btn-ghost h-10 w-10 justify-center" onClick={toggle} aria-label="Theme">
          {theme === 'light' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </div>
    </header>
  )
}

function SyncDot() {
  const [sync, setSync] = React.useState(null)
  React.useEffect(() => onSyncStatus(setSync), [])
  if (!sync) return null
  // Cloud sync failed (e.g. missing table / policies) — show a visible warning
  if (sync.lastError)
    return (
      <span className="flex items-center text-red-500" title={sync.lastError}>
        <WifiOff size={13} />
      </span>
    )
  if (sync.pending > 0)
    return (
      <span className="flex items-center text-amber-500" title={`${sync.pending} pending`}>
        <RefreshCw size={13} className="animate-spin" />
      </span>
    )
  return null
}
