import { LanguageProvider, useLanguage } from './LanguageContext.jsx'
import { ThemeProvider, useTheme } from './ThemeContext.jsx'
import { SidebarProvider, useSidebar } from './SidebarContext.jsx'
import { ToastProvider, useToast } from './ToastContext.jsx'

/**
 * AppProviders — composes every app-level provider in one wrapper,
 * so main.jsx stays a one-liner:
 *
 *   <HashRouter><AppProviders><App /></AppProviders></HashRouter>
 *
 * Order matters only for providers that read each other — currently all are
 * independent; SidebarProvider must stay INSIDE the Router (it uses useLocation).
 */
export function AppProviders({ children }) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <ToastProvider>
          <SidebarProvider>{children}</SidebarProvider>
        </ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  )
}

export { LanguageProvider, useLanguage, ThemeProvider, useTheme, SidebarProvider, useSidebar, ToastProvider, useToast }
