import { describe, expect, it } from 'vitest'
import Settings from '../../pages/Settings.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('Settings page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Settings />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
