import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import React from 'react'
import App from '../App'

describe('app smoke', () => {
  it('renders dashboard without crashing', () => {
    render(<App />)
    expect(document.body.textContent.length).toBeGreaterThan(0)
  })

  it('default language is Urdu (RTL)', () => {
    render(<App />)
    expect(document.documentElement.getAttribute('dir')).toBe('rtl')
  })

  it('seeds starter data once', () => {
    render(<App />)
    const blocks = JSON.parse(window.localStorage.getItem('marble.blocks') || '[]')
    expect(blocks.length).toBeGreaterThan(0)
  })
})
