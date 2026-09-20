import React, { useEffect } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

/** Toast: new content available → reload. */
export default function UpdatePrompt() {
  const { t } = useLang()
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  useEffect(() => {
    if (offlineReady) {
      const t = setTimeout(() => setOfflineReady(false), 4000)
      return () => clearTimeout(t)
    }
  }, [offlineReady, setOfflineReady])

  if (!needRefresh && !offlineReady) return null

  return (
    <div className="fixed top-3 inset-x-0 z-[92] flex justify-center px-3 no-print">
      <div className="card px-4 py-3 shadow-2xl flex items-center gap-3 max-w-md fade-in">
        <RefreshCw size={16} className="text-[var(--accent)]" />
        <span className="text-sm leading-urdu no-clip">
          {needRefresh ? t('pwa.updateReady') : t('pwa.offlineReady')}
        </span>
        {needRefresh && (
          <button className="btn btn-primary min-h-8 px-3 text-xs" onClick={() => updateServiceWorker(true)}>
            {t('pwa.reload')}
          </button>
        )}
        <button onClick={() => (needRefresh ? setNeedRefresh(false) : setOfflineReady(false))} aria-label="Close">
          <X size={14} className="text-[var(--muted)]" />
        </button>
      </div>
    </div>
  )
}
