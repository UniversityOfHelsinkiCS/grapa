import { describe, it, expect, beforeEach, vi } from 'vitest'
import * as React from 'react'
import { render, screen } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

const mockUseThesisStatistics: any = vi.fn()

vi.mock('../../hooks/useLoggedInUser', () => ({
  default: vi.fn().mockReturnValue({
    user: {
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      username: 'johndoe',
      managedDepartmentIds: ['1'],
      departmentId: '1',
    },
  }),
}))

vi.mock('../../hooks/useDepartments', () => ({
  default: vi.fn().mockReturnValue({
    departments: [
      {
        id: 1,
        name: {
          en: 'Department of Computer Science',
          fi: 'Tietojenkäsittelytieteen laitos',
        },
      },
      {
        id: 2,
        name: { en: 'Test department', fi: 'Testiosasto' },
      },
    ],
  }),
}))

vi.mock('../../hooks/useDepartmentAdmins', () => ({
  default: vi.fn().mockReturnValue({
    departmentAdmins: [
      {
        id: 1,
        departmentId: 1,
        userId: 1,
        department: {
          id: 1,
          name: {
            en: 'Department of Computer Science',
            fi: 'Tietojenkäsittelytieteen laitos',
          },
        },
        user: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          username: 'johndoe',
          departmentId: 1,
        },
      },
    ],
  }),
}))

vi.mock('../../hooks/useTheses', () => ({
  useThesisStatistics: mockUseThesisStatistics,
}))

vi.mock('react-router-dom', () => ({ Navigate: vi.fn() }))

vi.mock('echarts-for-react', () => ({
  default: () => <div data-testid="echarts-mock" />,
}))

const Statistics = (await import('./Statistics')).default

describe('Statistics', () => {
  beforeEach(() => {
    void initializeI18n()
    vi.mocked(mockUseThesisStatistics).mockReturnValue({
      thesisStatistics: {
        totals: {
          statusCounts: {
            PLANNING: 3,
            IN_PROGRESS: 1,
            COMPLETED: 1,
            CANCELLED: 0,
          },
          completedThesesTimes: [],
          inProgressThesesTimes: [],
        },
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
          },
        ],
      },
    })
  })

  it('renders all existing department admins', () => {
    render(<Statistics />)

    expect(
      screen.getByTestId('department-statistics-page-title')
    ).toBeInTheDocument()
    expect(screen.getByText('Doe John (test@test.fi)')).toBeInTheDocument()
    expect(
      screen.getByText('Tietojenkäsittelytieteen laitos')
    ).toBeInTheDocument()
  })
})
