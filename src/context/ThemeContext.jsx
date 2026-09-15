import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { STORAGE_KEYS } from '../constants/storageKeys.js'
import { storageGet, storageSet } from '../utils/storage.js'

/**
 * ThemeContext — light/dark state (split out of the old AppUIContext).
 *  - theme: 'light' (default) | 'dark' → persists to localStorage
 *  - toggleTheme(): flips light ↔ dark
 */
const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() =>
    storageGet(STORAGE_KEYS.THEME, 'light', { json: false })
  )

  // Theme → .dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    storageSet(STORAGE_KEYS.THEME, theme, { json: false })
  }, [theme])

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark')),
    }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider> (see context/index.jsx)')
  }
  return ctx
}
