/**
 * @jest-environment jsdom
 */
import * as React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import initializeI18n from '../../util/il18n'

jest.unstable_mockModule('./src/client/hooks/useDepartments', () => ({
  default: jest.fn().mockReturnValue({
    isLoading: false,
    departments: [
      {
        id: 'department-1',
        name: { en: 'Department one', fi: 'Osasto yksi' },
      },
      {
        id: 'department-2',
        name: { en: 'Department two', fi: 'Osasto kaksi' },
      },
    ],
  }),
}))

jest.unstable_mockModule(
  './src/client/components/Department/DepartmentTheses',
  () => ({
    default: jest.fn(({ filteringDepartmentId }) => (
      <div data-testid="department-theses">{filteringDepartmentId}</div>
    )),
  })
)

jest.unstable_mockModule(
  './src/client/components/Department/DepartmentAdmin',
  () => ({
    default: jest.fn(({ filteringDepartmentId, hideTitle }) => (
      <div data-testid="department-admin">{`${filteringDepartmentId}-${String(hideTitle)}`}</div>
    )),
  })
)

jest.unstable_mockModule(
  './src/client/components/Department/DepartmentStatistics',
  () => ({
    default: jest.fn(({ filteringDepartmentId, hideTitle }) => (
      <div data-testid="department-statistics">{`${filteringDepartmentId}-${String(hideTitle)}`}</div>
    )),
  })
)

const DepartmentOverview = (await import('./DepartmentOverview')).default

describe('DepartmentOverview', () => {
  beforeEach(() => {
    initializeI18n()
  })

  it('reads the selected department from the URL and defaults to the theses tab', () => {
    render(
      <MemoryRouter
        initialEntries={['/department-overview?departmentId=department-2']}
      >
        <DepartmentOverview />
      </MemoryRouter>
    )

    expect(screen.getByTestId('department-theses')).toHaveTextContent(
      'department-2'
    )
    expect(screen.getByText('Osasto kaksi')).toBeInTheDocument()
    expect(screen.queryByTestId('department-admin')).not.toBeInTheDocument()
  })

  it('shows the embedded department admin view in its own tab', async () => {
    render(
      <MemoryRouter
        initialEntries={['/department-overview?departmentId=department-2']}
      >
        <DepartmentOverview />
      </MemoryRouter>
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Osaston ylläpitäjät' }))

    expect(screen.getByTestId('department-admin')).toHaveTextContent(
      'department-2-true'
    )
    expect(screen.queryByTestId('department-theses')).not.toBeInTheDocument()
  })

  it('shows the embedded department statistics view when opened from the statistics tab URL', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          '/department-overview?departmentId=department-2&tab=statistics',
        ]}
      >
        <DepartmentOverview />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('department-statistics')).toHaveTextContent(
        'department-2-true'
      )
    })
  })

  it('defaults to the first managed department when the URL has no department id', async () => {
    render(
      <MemoryRouter initialEntries={['/department-overview']}>
        <DepartmentOverview />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('department-theses')).toHaveTextContent(
        'department-1'
      )
    })
  })
})
