import React from 'react'
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
