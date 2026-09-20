import React, { createContext, useContext, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(() => storage.get(STORAGE_KEYS.SIDEBAR, false))
  const [mobileOpen, setMobileOpen] = useState(false)

  const value = useMemo(
    () => ({
      open,
      toggle: () =>
        setOpen((o) => {
          const next = !o
          storage.set(STORAGE_KEYS.SIDEBAR, next)
          return next
        }),
      mobileOpen,
      openMobile: () => setMobileOpen(true),
      closeMobile: () => setMobileOpen(false),
    }),
    [open, mobileOpen],
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) throw new Error('useSidebar must be used inside SidebarProvider')
  return ctx
}
