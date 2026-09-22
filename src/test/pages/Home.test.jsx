import { describe, expect, it } from 'vitest'
import Home from '../../pages/Home.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('Home page (dashboard)', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Home />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
