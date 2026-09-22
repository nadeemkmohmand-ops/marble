import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../../context/index.jsx'
import { AuthProvider } from '../../context/AuthContext.jsx'
import { AppUIProvider } from '../../context/AppUIContext.jsx'

/**
 * renderWithProviders — wraps a component in MemoryRouter + the app's
 * real provider stack: AuthProvider (roles & permissions) → AppProviders
 * (language, theme, toast, sidebar) → AppUIProvider (modals, scanner,
 * print requests), mirroring the composition in App.jsx.
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <AppProviders>
          <AppUIProvider>{ui}</AppUIProvider>
        </AppProviders>
      </AuthProvider>
    </MemoryRouter>
  )
}
