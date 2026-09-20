import React from 'react'
import { HashRouter } from 'react-router-dom'

import { ThemeProvider } from './context/ThemeContext'
import { LanguageProvider } from './context/LanguageContext'
import { ToastProvider } from './context/ToastContext'
import { SidebarProvider } from './context/SidebarContext'
import { AuthProvider } from './context/AuthContext'
import { AppUIProvider } from './context/AppUIContext'
import AppRoutes from './routes.jsx'
import ErrorBoundary from './components/ErrorBoundary'
import InstallPrompt from './components/PWA/InstallPrompt'
import UpdatePrompt from './components/PWA/UpdatePrompt'
import ScannerModal from './components/ScannerModal'
import ConfirmDialog from './components/Feedback/ConfirmDialog'
import { seedIfEmpty } from './data/seed'

export default function App() {
  seedIfEmpty() // first-run starter data (guarded — runs once per device)
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <LanguageProvider>
          <ToastProvider>
            <AuthProvider>
              <SidebarProvider>
                <HashRouter>
                  <AppUIProvider>
                    <AppRoutes />
                    <ScannerModal />
                    <ConfirmDialog />
                    <InstallPrompt />
                    <UpdatePrompt />
                  </AppUIProvider>
                </HashRouter>
              </SidebarProvider>
            </AuthProvider>
          </ToastProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
