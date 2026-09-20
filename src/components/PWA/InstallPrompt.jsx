import React, { useEffect } from 'react'
import { Download, X } from 'lucide-react'
import { useLang } from '../../context/LanguageContext'

/** Bottom banner: "Install app" — appears when beforeinstallprompt fires. */
export default function InstallPrompt() {
  const { t } = useLang()
  const [deferred, setDeferred] = React.useState(null)
  const [hidden, setHidden] = React.useState(() => localStorage.getItem('marble.installDismissed') === '1')

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault()
      setDeferred(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!deferred || hidden) return null

  return (
    <div className="fixed bottom-20 lg:bottom-4 inset-x-3 lg:inset-x-auto lg:end-4 lg:max-w-sm z-[85] card p-4 shadow-2xl fade-in no-print">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-xl bg-[var(--accent)]/15 text-[var(--accent)] grid place-items-center">
          <Download size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold leading-urdu no-clip">{t('pwa.installTitle')}</p>
          <p className="text-xs text-[var(--muted)] leading-urdu no-clip mt-0.5">{t('pwa.installHint')}</p>
          <div className="flex gap-2 mt-3">
            <button
              className="btn btn-primary min-h-9 px-4 text-xs"
              onClick={async () => {
                deferred.prompt()
                await deferred.userChoice
                setDeferred(null)
              }}
            >
              {t('pwa.install')}
            </button>
            <button
              className="btn btn-ghost min-h-9 px-3 text-xs"
              onClick={() => {
                localStorage.setItem('marble.installDismissed', '1')
                setHidden(true)
              }}
            >
              {t('common.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
