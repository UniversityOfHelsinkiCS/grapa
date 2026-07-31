import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import initializeI18n from '../../util/il18n'

const useLoggedInUserMock = vi.fn()

vi.mock('../../hooks/usePrograms', () => ({
  default: vi.fn().mockReturnValue({
    isLoading: false,
    programs: [],
  }),
  useUpdateProgramMutation: vi.fn().mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn(),
  }),
}))

vi.mock('../../hooks/useEvents', () => ({
  useProgramEvents: vi.fn().mockReturnValue({
    events: [],
    isLoading: false,
  }),
}))

vi.mock('../../hooks/useLoggedInUser', () => ({
  default: useLoggedInUserMock,
}))

vi.mock('../../hooks/useDepartments', () => ({
  default: vi.fn().mockReturnValue({
    isLoading: false,
    departments: [
      {
        id: 'department-1',
        name: { en: 'Department one', fi: 'Yksikkö yksi' },
      },
      {
        id: 'department-2',
        name: { en: 'Department two', fi: 'Yksikkö kaksi' },
      },
    ],
  }),
}))

vi.mock('../ThesisPage/ThesesPage', () => ({
  default: vi.fn(({ filteringDepartmentId }) => (
    <div data-testid="theses-page">{filteringDepartmentId}</div>
  )),
}))

vi.mock('./ManageEntityPermissions', () => ({
  default: vi.fn(({ filteringEntityId, hideTitle, entityType }) => (
    <div data-testid="entity-management">{`${filteringEntityId}-${String(hideTitle)}-${entityType}`}</div>
  )),
}))

vi.mock('./Statistics', () => ({
  default: vi.fn(({ filteringDepartmentId, hideTitle }) => (
    <div data-testid="department-statistics">{`${filteringDepartmentId}-${String(hideTitle)}`}</div>
  )),
}))

const EntityOverview = (await import('./EntityOverview')).default

const renderDepartmentOverview = (initialEntry: any) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/departments">
          <Route index element={<EntityOverview entityType="department" />} />
          <Route
            path=":departmentId"
            element={<EntityOverview entityType="department" />}
          />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('EntityOverview (Department)', () => {
  beforeEach(() => {
    void initializeI18n()
    vi.mocked(useLoggedInUserMock).mockReturnValue({
      user: { isAdmin: true },
      isLoading: false,
    })
  })

  it('reads the selected department from the URL and defaults to the theses tab', () => {
    renderDepartmentOverview('/departments/department-2')

    expect(screen.getByTestId('theses-page')).toHaveTextContent('department-2')
    expect(screen.getByText('Yksikkö kaksi')).toBeInTheDocument()
    expect(screen.queryByTestId('entity-management')).not.toBeInTheDocument()
    expect(
      screen.queryByTestId('department-statistics')
    ).not.toBeInTheDocument()
  })

  it('shows the embedded entity management view in its own tab', async () => {
    renderDepartmentOverview('/departments/department-2')

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Hallinnoi oikeuksia' }))

    expect(screen.getByTestId('entity-management')).toHaveTextContent(
      'department-2-true-department'
    )
    expect(screen.queryByTestId('theses-page')).not.toBeInTheDocument()
  })

  it('shows the embedded department statistics view when statistics tab is clicked', async () => {
    renderDepartmentOverview('/departments/department-2')

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Tilastot' }))

    await waitFor(() => {
      expect(screen.getByTestId('department-statistics')).toHaveTextContent(
        'department-2-true'
      )
    })
  })

  it('defaults to the first managed department when the URL has no department id', async () => {
    renderDepartmentOverview('/departments')

    await waitFor(() => {
      expect(screen.getByTestId('theses-page')).toHaveTextContent(
        'department-1'
      )
    })
  })
})
