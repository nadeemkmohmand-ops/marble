/**
 * @deprecated Compatibility shim — the old AppUIContext was split into:
 *   context/ThemeContext.jsx      (theme, setTheme, toggleTheme)
 *   context/LanguageContext.jsx   (lang, setLang, t, pick, isRTL)
 *   context/SidebarContext.jsx    (sidebar open state)
 *   context/ToastContext.jsx      (toast feedback)
 * All are composed in context/index.jsx via <AppProviders>.
 *
 * Existing pages keep working unchanged through useAppUI() below.
 * New code should import the specific hook it needs.
 */
import { useMemo } from 'react'
import { AppProviders, useLanguage, useTheme } from './index.jsx'

export function AppUIProvider({ children }) {
  return <AppProviders>{children}</AppProviders>
}

export function useAppUI() {
  const theme = useTheme()
  const language = useLanguage()

  return useMemo(
    () => ({ ...theme, ...language, isRTL: language.lang === 'ur' }),
    [theme, language]
  )
}
