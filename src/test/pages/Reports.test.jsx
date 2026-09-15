import { describe, expect, it } from 'vitest'
import Reports from '../../pages/Reports.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('Reports page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Reports />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
