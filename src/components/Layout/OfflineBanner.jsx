import { WifiOff } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'

/**
 * OfflineBanner — "آف لائن موڈ" indicator shown under the header while the
 * PWA has no network connection (useOnlineStatus hook).
 */
export default function OfflineBanner() {
  const online = useOnlineStatus()
  const { t } = useLanguage()

  if (online) return null

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-warning-light px-4 py-2 text-xs font-bold text-warning-dark dark:bg-warning/15 dark:text-warning"
    >
      <WifiOff size={14} aria-hidden="true" />
      {t('pwa.offline')}
    </div>
  )
}
