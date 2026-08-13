import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

const mockUseThesisStatistics: any = vi.fn()

vi.mock('../../hooks/useTheses', () => ({
  useThesisStatistics: mockUseThesisStatistics,
}))

const Supervisions = (await import('./Supervisions')).default

describe('Supervisions', () => {
  beforeEach(() => {
    void initializeI18n()
    vi.mocked(mockUseThesisStatistics).mockReturnValue({
      thesisStatistics: {
        supervisors: [
          {
            department: {
              id: 1,
              name: {
                en: 'Department of Computer Science',
                fi: 'Tietojenkäsittelytieteen laitos',
              },
            },
            statusCounts: {
              PLANNING: 3,
              IN_PROGRESS: 1,
              COMPLETED: 1,
              CANCELLED: 0,
            },
            supervisor: {
              id: 1,
              firstName: 'John',
              lastName: 'Doe',
              username: 'johndoe',
              email: 'test@test.fi',
              departmentId: 1,
            },
            startedWithinHalfYearCount: 2,
            lateSupervisionsCount: 0,
            veryLateSupervisionsCount: 0,
            avgLateSupervision: 0,
            avgCompletedSupervision: 0,
            primarySupervisionsCount: 0,
          },
        ],
      },
    })
  })

  it('renders supervisors in the table', () => {
    render(<Supervisions />)

    expect(screen.getByText('Doe John (test@test.fi)')).toBeInTheDocument()
    expect(
      screen.getByText('Tietojenkäsittelytieteen laitos')
    ).toBeInTheDocument()
  })
})
