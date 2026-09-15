import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Unmount React trees after every test ( Vitest globals are enabled in vite.config.js )
afterEach(() => {
  cleanup()
})
