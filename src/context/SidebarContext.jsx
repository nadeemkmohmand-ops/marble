import React, { createContext, useContext, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys'
import { storage } from '../utils/storage'

const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  // `open` now means "the drawer is open" on ALL screen sizes (desktop + mobile).
  // The sidebar is fully hidden by default and only appears as an overlay
  // when the hamburger button is clicked; it never reserves layout space.
  const [open, setOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const value = useMemo(
    () => ({
      open,
      toggle: () => setOpen((o) => !o),
      close: () => setOpen(false),
      // Kept for backwards compatibility with any code still calling these —
      // both now drive the same single overlay drawer as `open`/`toggle`.
      mobileOpen,
      openMobile: () => setOpen(true),
      closeMobile: () => setOpen(false),
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
