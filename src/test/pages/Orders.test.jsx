import { describe, expect, it } from 'vitest'
import Orders from '../../pages/Orders.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('Orders page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Orders />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
