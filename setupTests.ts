import '@testing-library/jest-dom'
import { jest } from '@jest/globals'

import { TextEncoder } from 'util'

global.jest = jest
global.TextEncoder = TextEncoder
