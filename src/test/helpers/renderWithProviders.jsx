import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '../../context/index.jsx'

/**
 * renderWithProviders — wraps a component in MemoryRouter + AppProviders
 * (language, theme, toast, sidebar) so pages render exactly like in the app.
 */
export function renderWithProviders(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders>{ui}</AppProviders>
    </MemoryRouter>
  )
}
