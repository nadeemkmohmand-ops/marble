import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import ToastViewport from '../components/Feedback/Toast.jsx'

/**
 * ToastContext — global notification mechanism (previously missing entirely).
 *
 *   const { toast } = useToast()
 *   toast('سادہ پیغام')
 *   toast({ type: 'success', message: 'محفوظ ہو گیا' })
 *   toast({ type: 'error', message: '...', duration: 0, action: { label: 'ری لوڈ', onClick } })
 *
 * Types: 'success' | 'error' | 'warning' | 'info' (default).
 * duration 0 = sticky (no auto-dismiss). Announced via an aria-live region.
 */
export const GLOBAL_ERROR_EVENT = 'mfa:global-error'

const MAX_VISIBLE = 4
const DEFAULT_DURATION = 4000

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((list) => list.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback((input) => {
    const item = typeof input === 'string' ? { message: input } : input || {}
    counter.current += 1
    const id = counter.current
    const entry = { id, type: 'info', duration: DEFAULT_DURATION, ...item }
    setToasts((list) => [...list.slice(-(MAX_VISIBLE - 1)), entry])
    return id
  }, [])

  // Bridge for window-level errors (see main.jsx global listeners → dev toast)
  useEffect(() => {
    const onGlobalError = (event) => {
      const detail = event.detail || {}
      toast({ type: 'error', message: detail.message || 'Unexpected error', duration: 6000 })
    }
    window.addEventListener(GLOBAL_ERROR_EVENT, onGlobalError)
    return () => window.removeEventListener(GLOBAL_ERROR_EVENT, onGlobalError)
  }, [toast])

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider> (see context/index.jsx)')
  }
  return ctx
}
