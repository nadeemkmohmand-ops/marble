/* eslint-disable react-refresh/only-export-components -- install helpers are intentionally co-located here so the app needs no extra utils file */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { Download, X } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { useAppUI } from '../../context/AppUIContext.jsx'
import { PATHS } from '../../constants/routes.js'

/** How long the small install dialog stays visible on the main page. */
const AUTO_DISMISS_MS = 1500 // 1.5 seconds — then it disappears on its own

/* ------------------------------------------------------------------ *
 * PWA install capture — lives INSIDE this file on purpose:
 * utils/pwaInstall.js was merged here so the project needs no extra
 * file (Vercel failed with "Could not resolve ../../utils/pwaInstall.js").
 *
 * The browser fires "beforeinstallprompt" ONCE per page load, so the
 * event is captured at module level and shared with the "Add to Home
 * Screen" item in UserMenu, which imports promptInstall/usePwaInstall
 * from this same module below.
 *
 * On iOS Safari beforeinstallprompt never fires — canInstall() stays
 * false and callers fall back to manual instructions (pwa.installManual).
 * ------------------------------------------------------------------ */

let deferredPrompt = null
const listeners = new Set()

function emit() {
  listeners.forEach((fn) => fn())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Stop Chrome's own mini-infobar — we show our own dialog instead.
    event.preventDefault()
    deferredPrompt = event
    emit()
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    emit()
  })
}

/** Native install prompt available right now? */
export function canInstall() {
  return deferredPrompt !== null
}

/**
 * Trigger the native install dialog.
 * Returns 'accepted' | 'dismissed' | 'unavailable'.
 */
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'
  const event = deferredPrompt
  deferredPrompt = null // prompt() may fire only once — consume it first
  emit()
  try {
    event.prompt()
    const choice = await event.userChoice
    if (choice.outcome === 'accepted') return 'accepted'
    return 'dismissed'
  } catch {
    return 'unavailable'
  }
}

/** React hook — re-renders when install availability changes. */
export function usePwaInstall() {
  const available = useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    () => deferredPrompt !== null,
    () => false
  )
  return { canInstall: available, promptInstall }
}

/**
 * InstallPrompt — SMALL dialog on the MAIN page (Home) only.
 * Appears when the browser reports the app is installable, auto-dismisses
 * after 1.5 s, and installs immediately when "انسٹال کریں" is tapped.
 * A permanent "Add to Home Screen" action also lives in the user menu
 * (UserMenu) and reuses the capture defined above in this file.
 */
export default function InstallPrompt() {
  const { t } = useAppUI()
  const { canInstall } = usePwaInstall()
  const { pathname } = useLocation()
  const [visible, setVisible] = useState(true)

  // Reset visibility whenever the browser reports a fresh install prompt
  useEffect(() => {
    if (canInstall) setVisible(true)
  }, [canInstall])

  // Auto-dismiss after 1.5 s (unless the user taps Install)
  useEffect(() => {
    if (!visible) return undefined
    const timer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [visible])

  // Main page only — the dialog should not follow the user around
  if (pathname !== PATHS.HOME || !canInstall || !visible) return null

  const handleInstall = async () => {
    setVisible(false)
    await promptInstall()
  }

  return (
    <div
      className="fixed inset-x-4 bottom-24 z-40 md:bottom-6 md:mx-auto md:max-w-xs"
      role="dialog"
      aria-label={t('pwa.installTitle')}
    >
      <div className="surface fade-up flex items-center gap-3 p-3 shadow-lg">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white">
          <Download size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-main">{t('pwa.installTitle')}</p>
          <p className="text-[11px] text-muted">{t('pwa.addToHome')}</p>
        </div>

        <button
          type="button"
          onClick={handleInstall}
          className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-light"
        >
          {t('pwa.install')}
        </button>

        <button
          type="button"
          onClick={() => setVisible(false)}
          className="icon-btn h-6 w-6 shrink-0"
          aria-label={t('common.close')}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
