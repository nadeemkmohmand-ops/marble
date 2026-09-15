import { describe, expect, it } from 'vitest'
import About from '../../pages/About.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('About page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<About />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
