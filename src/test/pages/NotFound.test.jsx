import { describe, expect, it } from 'vitest'
import NotFound from '../../pages/NotFound.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('NotFound page (404)', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<NotFound />, { route: '/does-not-exist' })
    expect(container).not.toBeEmptyDOMElement()
  })
})
