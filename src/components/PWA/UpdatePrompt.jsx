import { useRef } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { useLanguage } from '../../context/LanguageContext.jsx'
import { useToast } from '../../context/ToastContext.jsx'

/**
 * UpdatePrompt — PWA "new version available" flow.
 * Hooks vite-plugin-pwa's onNeedRefresh and surfaces a toast with a
 * "ری لوڈ کریں" action that activates the waiting service worker.
 *
 * Works when registerType is 'prompt' (see vite.config.js). With
 * 'autoUpdate' the SW swaps silently and this stays dormant — the seam
 * is ready either way.
 */
export default function UpdatePrompt() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const shownRef = useRef(false)

  const { updateServiceWorker } = useRegisterSW({
    onNeedRefresh() {
      if (shownRef.current) return
      shownRef.current = true
      toast({
        type: 'info',
        message: t('pwa.updateReady'),
        duration: 0, // sticky until dismissed / acted on
        action: {
          label: t('pwa.reload'),
          onClick: () => updateServiceWorker(true),
        },
      })
    },
  })

  return null
}
