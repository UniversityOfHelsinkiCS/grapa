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
    programs: [
      {
        id: 'program-1',
        name: { en: 'Program one', fi: 'Ohjelma yksi' },
        options: {},
      },
      {
        id: 'program-2',
        name: { en: 'Program two', fi: 'Ohjelma kaksi' },
        options: { seminar: false },
      },
    ],
  }),
  useUpdateProgramOptionsMutation: jest.fn().mockReturnValue({
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

jest.unstable_mockModule(
  './src/client/components/ThesisPage/ThesesPage',
  () => ({
    default: jest.fn(({ filteringProgramId }) => (
      <div data-testid="theses-page">{filteringProgramId}</div>
    )),
  })
)

jest.unstable_mockModule(
  './src/client/components/Program/ProgramManagement',
  () => ({
    default: jest.fn(({ filteringProgramId, hideTitle }) => (
      <div data-testid="program-management">{`${filteringProgramId}-${String(hideTitle)}`}</div>
    )),
  })
)

const ProgramOverview = (await import('./ProgramOverview')).default
const { useUpdateProgramOptionsMutation } = await import(
  '../../hooks/usePrograms'
)

const renderProgramOverview = (initialEntry) =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/programs">
          <Route index element={<ProgramOverview />} />
          <Route path=":programId" element={<ProgramOverview />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )

describe('ProgramOverview', () => {
  beforeEach(() => {
    initializeI18n()
    useLoggedInUserMock.mockReturnValue({
      user: { isAdmin: true },
      isLoading: false,
    })
  })

  it('reads the selected program from the URL and defaults to the theses tab', () => {
    renderProgramOverview('/programs/program-2')

    expect(screen.queryByTestId('program-select-input')).not.toBeInTheDocument()
    expect(screen.getByTestId('theses-page')).toHaveTextContent('program-2')
    expect(screen.getByText('Ohjelma kaksi')).toBeInTheDocument()
    expect(screen.queryByTestId('program-management')).not.toBeInTheDocument()
  })

  it('shows the embedded rights view in its own tab', async () => {
    renderProgramOverview('/programs/program-2')

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Ohjelmavastaavat' }))

    expect(screen.getByTestId('program-management')).toHaveTextContent(
      'program-2-true'
    )
    expect(screen.queryByTestId('theses-page')).not.toBeInTheDocument()
  })

  it('asks for confirmation before persisting the seminar toggle', async () => {
    renderProgramOverview('/programs/program-2')

    const user = userEvent.setup()
    const mutation = useUpdateProgramOptionsMutation()

    await user.click(screen.getByRole('tab', { name: 'Asetukset' }))

    const seminarToggle = screen.getByRole('checkbox')
    expect(seminarToggle).not.toBeChecked()

    await user.click(seminarToggle)

    expect(mutation.mutateAsync).not.toHaveBeenCalled()
    expect(
      screen.getByText('Haluatko varmasti ottaa seminaarivaatimuksen käyttöön?')
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tallenna' }))

    expect(mutation.mutateAsync).toHaveBeenCalledWith({
      programId: 'program-2',
      options: { seminar: true },
    })
  })

  it('defaults to the first managed program when the URL has no program id', async () => {
    renderProgramOverview('/programs')

    await waitFor(() => {
      expect(screen.getByTestId('theses-page')).toHaveTextContent('program-1')
    })
  })

  it('hides the configurations tab for non-admin users', () => {
    useLoggedInUserMock.mockReturnValue({
      user: { isAdmin: false },
      isLoading: false,
    })

    renderProgramOverview('/programs/program-2')

    expect(
      screen.queryByRole('tab', { name: 'Asetukset' })
    ).not.toBeInTheDocument()
  })
})
