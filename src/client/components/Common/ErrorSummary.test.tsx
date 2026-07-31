import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

vi.mock('@mui/icons-material/ReportOutlined', () => ({
  default: vi.fn().mockReturnValue('ReportOutlinedIcon'),
}))

const ErrorSummary = (await import('./ErrorSummary')).default

describe('ErrorSummary', () => {
  beforeEach(() => {
    void initializeI18n()

    render(
      <ErrorSummary label="Form contains the following errors">
        <ul>
          <li>
            Error 1: <a href="#field1">Please enter your first name</a>
          </li>
          <li>
            Error 2: <a href="#field2">Please enter your last name</a>
          </li>
          <li>
            Error 3: <a href="#field3">Please enter a valid email address</a>
          </li>
        </ul>
      </ErrorSummary>
    )
  })

  it('renders the component', () => {
    expect(screen.getByTestId('error-summary')).toBeInTheDocument()
  })
})
