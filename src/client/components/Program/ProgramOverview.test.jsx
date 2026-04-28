/**
 * @jest-environment jsdom
 */
import * as React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import initializeI18n from '../../util/il18n'

jest.unstable_mockModule('./src/client/hooks/usePrograms', () => ({
  default: jest.fn().mockReturnValue({
    isLoading: false,
    programs: [
      {
        id: 'program-1',
        name: { en: 'Program one', fi: 'Ohjelma yksi' },
      },
      {
        id: 'program-2',
        name: { en: 'Program two', fi: 'Ohjelma kaksi' },
      },
    ],
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useEvents', () => ({
  useProgramEvents: jest.fn().mockReturnValue({
    events: [],
    isLoading: false,
  }),
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

  it('defaults to the first managed program when the URL has no program id', async () => {
    renderProgramOverview('/programs')

    await waitFor(() => {
      expect(screen.getByTestId('theses-page')).toHaveTextContent('program-1')
    })
  })
})
