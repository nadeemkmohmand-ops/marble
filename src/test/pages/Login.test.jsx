import { describe, expect, it } from 'vitest'
import Login from '../../pages/Login.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('Login page (auth shell placeholder)', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Login />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
