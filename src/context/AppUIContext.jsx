import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'
import ROUTES from '../constants/routes'

const AppUIContext = createContext(null)

/**
 * Global UI bus: confirm dialog, print requests (→ PrintPreview page)
 * and scanner requests (→ ScannerModal). Anything that needs to "jump"
 * across pages goes through here.
 */
export function AppUIProvider({ children }) {
  const [confirmState, setConfirmState] = useState(null)
  const [scanState, setScanState] = useState(null) // { active, resolve }
  const navigate = useNavigate()

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        setConfirmState({ ...options, _resolve: resolve })
      }),
    [],
  )

  const resolveConfirm = useCallback((ok) => {
    setConfirmState((s) => {
      s?._resolve?.(ok)
      return null
    })
  }, [])

  /** requestPrint({template:'invoice', data:{order, customer}, title:'…'}) */
  const requestPrint = useCallback(
    (payload) => {
      storage.set(STORAGE_KEYS.PRINT_REQUEST, { ...payload, at: Date.now() })
      navigate(ROUTES.PRINT)
    },
    [navigate],
  )

  /** requestScan().then(code => …) — opens the camera scanner modal. */
  const requestScan = useCallback(
    () =>
      new Promise((resolve) => {
        setScanState({ active: true, resolve })
      }),
    [],
  )

  const resolveScan = useCallback((code) => {
    setScanState((s) => {
      s?.resolve?.(code)
      return null
    })
  }, [])

  const value = useMemo(
    () => ({ confirm, requestPrint, requestScan, scanState, resolveScan }),
    [confirm, requestPrint, requestScan, scanState, resolveScan],
  )

  return <AppUIContext.Provider value={value}>{children}</AppUIContext.Provider>
}

export function useAppUI() {
  const ctx = useContext(AppUIContext)
  if (!ctx) throw new Error('useAppUI must be used inside AppUIProvider')
  return ctx
}

/** One-shot read of a print request stored before navigating to /print. */
export function consumePrintRequest() {
  const payload = storage.get(STORAGE_KEYS.PRINT_REQUEST, null)
  return payload
}
