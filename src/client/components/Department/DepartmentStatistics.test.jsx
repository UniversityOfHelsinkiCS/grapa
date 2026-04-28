/**
 * @jest-environment jsdom
 */
import * as React from 'react'
import { render, screen } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

const mockUseDepartmentStatistics = jest.fn()

jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: jest.fn().mockReturnValue({
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

jest.unstable_mockModule('./src/client/hooks/useDepartments', () => ({
  default: jest.fn().mockReturnValue({
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

jest.unstable_mockModule('./src/client/hooks/useDepartmentAdmins', () => ({
  default: jest.fn().mockReturnValue({
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
  useDepartmentStatistics: mockUseDepartmentStatistics,
}))

jest.unstable_mockModule('react-router-dom', () => ({ Navigate: jest.fn() }))

const DepartmentStatistics = (await import('./DepartmentStatistics')).default

describe('DepartmentStatistics', () => {
  beforeEach(() => {
    initializeI18n()
    mockUseDepartmentStatistics.mockReturnValue({
      departmentStatistics: [
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
    })
  })

  it('renders all existing department admins', () => {
    render(<DepartmentStatistics />)

    expect(
      screen.getByTestId('department-statistics-page-title')
    ).toBeInTheDocument()
    expect(screen.getByText('Doe John (test@test.fi)')).toBeInTheDocument()
    expect(
      screen.getByText('Tietojenkäsittelytieteen laitos')
    ).toBeInTheDocument()
  })

  it('ignores statistics rows without a department when filtering by department', () => {
    mockUseDepartmentStatistics.mockReturnValue({
      departmentStatistics: [
        {
          department: undefined,
          statusCounts: {
            PLANNING: 2,
            IN_PROGRESS: 0,
            COMPLETED: 0,
            CANCELLED: 0,
          },
          supervisor: {
            id: 99,
            firstName: 'Missing',
            lastName: 'Department',
            username: 'missingdepartment',
            email: 'missing@test.fi',
          },
        },
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
    })

    render(<DepartmentStatistics filteringDepartmentId="1" />)

    expect(screen.getByText('Doe John (test@test.fi)')).toBeInTheDocument()
    expect(
      screen.queryByText('Department Missing (missing@test.fi)')
    ).not.toBeInTheDocument()
  })
})
