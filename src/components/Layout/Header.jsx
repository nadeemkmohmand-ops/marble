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
  const { openMobile } = useSidebar()
  const { theme, toggle } = useTheme()
  const { toggleLang, lang, t } = useLang()
  const online = useOnlineStatus()

  return (
    <header className="app-header sticky top-0 z-40 h-16 flex items-center gap-2 px-3 sm:px-5 bg-[var(--card)]/90 backdrop-blur border-b border-[var(--border)] no-print">
      <button className="btn btn-ghost h-10 w-10 justify-center lg:hidden" onClick={openMobile} aria-label="Menu">
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
  if (!sync || (sync.pending === 0 && sync.lastSync)) return null
  if (sync.pending > 0)
    return (
      <span className="hidden sm:flex items-center gap-1 text-[11px] text-amber-500" title={`${sync.pending} pending`}>
        <RefreshCw size={13} className="animate-spin" />
      </span>
    )
  return null
}
