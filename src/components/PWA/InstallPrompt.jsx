import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import Button from '../UI/Button.jsx'
import { useAppUI } from '../../context/AppUIContext.jsx'
import { STORAGE_KEYS } from '../../constants/storageKeys.js'
import { storageGet, storageSet } from '../../utils/storage.js'

/**
 * InstallPrompt — "Add to Home Screen" UI.
 * Captures the browser's beforeinstallprompt event and shows a dismissible
 * banner above the bottom navigation. UI only — no complex install logic.
 * (On iOS Safari the beforeinstallprompt event never fires, so the banner
 *  simply stays hidden; users install via the Safari share menu.)
 */
export default function InstallPrompt() {
  const { t } = useAppUI()
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [dismissed, setDismissed] = useState(() => storageGet(STORAGE_KEYS.INSTALL_DISMISSED, '0', { json: false }) === '1')

  useEffect(() => {
    const onBeforeInstallPrompt = (event) => {
      event.preventDefault()
      setDeferredPrompt(event)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setDismissed(true)
    storageSet(STORAGE_KEYS.INSTALL_DISMISSED, '1', { json: false })
  }

  if (!deferredPrompt || dismissed) return null

  return (
    <div
      className="fixed inset-x-4 bottom-24 z-40 md:bottom-6 md:mx-auto md:max-w-md"
      role="dialog"
      aria-label={t('pwa.installTitle')}
    >
      <div className="surface fade-up flex items-center gap-3 p-3.5 shadow-lg">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Download size={20} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-main">{t('pwa.installTitle')}</p>
          <p className="truncate text-xs text-muted">{t('pwa.installDesc')}</p>
        </div>

        <Button size="sm" variant="accent" onClick={handleInstall}>
          {t('pwa.install')}
        </Button>

        <button type="button" onClick={handleDismiss} className="icon-btn" aria-label={t('common.close')}>
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
