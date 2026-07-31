import '@testing-library/jest-dom/vitest'
import { TextEncoder } from 'util'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(() => {
  cleanup()
})

global.TextEncoder = TextEncoder
