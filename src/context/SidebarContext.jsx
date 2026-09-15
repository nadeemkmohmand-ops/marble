import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * SidebarContext — Header / Sidebar / drawer visibility state.
 * (Previously local component state inside Layout.jsx.)
 * The drawer closes automatically on every route change.
 */
const SidebarContext = createContext(null)

export function SidebarProvider({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  // close the drawer whenever the route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  const value = useMemo(
    () => ({
      open,
      setOpen,
      openSidebar: () => setOpen(true),
      closeSidebar: () => setOpen(false),
      toggleSidebar: () => setOpen((prev) => !prev),
    }),
    [open]
  )

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = useContext(SidebarContext)
  if (!ctx) {
    throw new Error('useSidebar must be used inside <SidebarProvider> (see context/index.jsx)')
  }
  return ctx
}
