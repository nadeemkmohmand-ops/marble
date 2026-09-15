import { useSyncExternalStore } from 'react'

/**
 * pwaInstall — global capture of the browser's beforeinstallprompt event.
 *
 * The event fires ONCE per page load, so it is captured at module level and
 * shared everywhere: the small auto-dismissing dialog on the main page
 * (InstallPrompt) and the "Add to Home Screen" item in the user menu both
 * trigger the same native install flow via promptInstall().
 *
 * On iOS Safari beforeinstallprompt never fires — canInstall() stays false
 * and callers fall back to manual instructions (pwa.installManual).
 */

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
  deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  if (choice.outcome === 'accepted') {
    deferredPrompt = null
    emit()
    return 'accepted'
  }
  return 'dismissed'
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
