/**
 * @jest-environment jsdom
 */
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import initializeI18n from '../../util/il18n'

const useLoggedInUserMock = jest.fn()

jest.unstable_mockModule('./src/client/hooks/usePrograms', () => ({
  default: jest.fn().mockReturnValue({
    isLoading: false,
    programs: [],
  }),
  useUpdateProgramMutation: jest.fn().mockReturnValue({
    isPending: false,
    mutateAsync: jest.fn(),
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useEvents', () => ({
  useProgramEvents: jest.fn().mockReturnValue({
    events: [],
    isLoading: false,
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: useLoggedInUserMock,
}))

jest.unstable_mockModule('./src/client/hooks/useDepartments', () => ({
  default: jest.fn().mockReturnValue({
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

jest.unstable_mockModule(
  './src/client/components/ThesisPage/ThesesPage',
  () => ({
    default: jest.fn(({ filteringDepartmentId }) => (
      <div data-testid="theses-page">{filteringDepartmentId}</div>
    )),
  })
)

jest.unstable_mockModule(
  './src/client/components/Program/EntityManagement',
  () => ({
    default: jest.fn(({ filteringEntityId, hideTitle, entityType }) => (
      <div data-testid="entity-management">{`${filteringEntityId}-${String(hideTitle)}-${entityType}`}</div>
    )),
  })
)

jest.unstable_mockModule(
  './src/client/components/Program/DepartmentStatistics',
  () => ({
    default: jest.fn(({ filteringDepartmentId, hideTitle }) => (
      <div data-testid="department-statistics">{`${filteringDepartmentId}-${String(hideTitle)}`}</div>
    )),
  })
)

const EntityOverview = (await import('./EntityOverview')).default

const renderDepartmentOverview = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/departments">
          <Route index element={<EntityOverview entityType="department" />} />
          <Route path=":departmentId" element={<EntityOverview entityType="department" />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('EntityOverview (Department)', () => {
  beforeEach(() => {
    initializeI18n()
    useLoggedInUserMock.mockReturnValue({
      user: { isAdmin: true },
      isLoading: false,
    })
  })

  it('reads the selected department from the URL and defaults to the theses tab', () => {
    renderDepartmentOverview('/departments/department-2')

    expect(screen.getByTestId('theses-page')).toHaveTextContent('department-2')
    expect(screen.getByText('Yksikkö kaksi')).toBeInTheDocument()
    expect(screen.queryByTestId('entity-management')).not.toBeInTheDocument()
    expect(screen.queryByTestId('department-statistics')).not.toBeInTheDocument()
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
    await user.click(screen.getByRole('tab', { name: 'Ohjaustilastot' }))

    await waitFor(() => {
      expect(screen.getByTestId('department-statistics')).toHaveTextContent(
        'department-2-true'
      )
    })
  })

  it('defaults to the first managed department when the URL has no department id', async () => {
    renderDepartmentOverview('/departments')

    await waitFor(() => {
      expect(screen.getByTestId('theses-page')).toHaveTextContent('department-1')
    })
  })
})
