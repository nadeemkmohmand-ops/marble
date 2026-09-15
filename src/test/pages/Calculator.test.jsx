import { describe, expect, it } from 'vitest'
import Calculator from '../../pages/Calculator.jsx'
import { renderWithProviders } from '../helpers/renderWithProviders.jsx'

describe('Calculator page', () => {
  it('renders without crashing', () => {
    const { container } = renderWithProviders(<Calculator />)
    expect(container).not.toBeEmptyDOMElement()
  })
})
