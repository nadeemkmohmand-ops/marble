import { describe, expect, it } from 'vitest'
import Inventory from '../../pages/Inventory.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('Inventory page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Inventory />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
