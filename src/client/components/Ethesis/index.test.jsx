/**
 * @jest-environment jsdom
 */
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import initializeI18n from '../../util/il18n'

const useLoggedInUserMock = jest.fn()

jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: useLoggedInUserMock,
}))

jest.unstable_mockModule('./src/client/hooks/useTheses', () => ({
  usePaginatedTheses: jest.fn().mockReturnValue({
    theses: [
      {
        id: 'thesis-1',
        topic: 'Test thesis',
        status: 'ETHESIS_SENT',
        ethesisDate: '2026-04-01T00:00:00.000Z',
        authors: [{ firstName: 'Ada', lastName: 'Lovelace' }],
        graders: [],
      },
    ],
    isLoading: false,
  }),
}))

jest.unstable_mockModule('./src/client/components/Ethesis/Modal', () => ({
  default: jest.fn(() => null),
}))

jest.unstable_mockModule('./src/client/components/Ethesis/AdminPage', () => ({
  default: jest.fn(({ disableContainer, hideTitle }) => (
    <div data-testid="ethesis-admin-page">
      {`${String(disableContainer)}-${String(hideTitle)}`}
    </div>
  )),
}))

const Ethesis = (await import('./index')).default

describe('Ethesis', () => {
  beforeEach(() => {
    initializeI18n()
    useLoggedInUserMock.mockReset()
  })

  it('shows the overview tab by default', () => {
    useLoggedInUserMock.mockReturnValue({
      user: { isAdmin: true, ethesisAdmin: true },
    })

    render(
      <MemoryRouter initialEntries={['/ethesis']}>
        <Ethesis />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('tab', { name: 'Overview', selected: true })
    ).toBeInTheDocument()
    expect(screen.getByText('Show:')).toBeInTheDocument()
    expect(screen.getByText('Test thesis')).toBeInTheDocument()
    expect(screen.queryByTestId('ethesis-admin-page')).not.toBeInTheDocument()
  })

  it('shows the admins tab content when opened from the admins tab URL', () => {
    useLoggedInUserMock.mockReturnValue({
      user: { isAdmin: true, ethesisAdmin: true },
    })

    render(
      <MemoryRouter initialEntries={['/ethesis?tab=admins']}>
        <Ethesis />
      </MemoryRouter>
    )

    expect(
      screen.getByRole('tab', { name: 'Admins', selected: true })
    ).toBeInTheDocument()
    expect(screen.getByTestId('ethesis-admin-page')).toHaveTextContent(
      'true-true'
    )
  })

  it('allows switching from overview to admins for admins', async () => {
    useLoggedInUserMock.mockReturnValue({
      user: { isAdmin: true, ethesisAdmin: true },
    })

    render(
      <MemoryRouter initialEntries={['/ethesis']}>
        <Ethesis />
      </MemoryRouter>
    )

    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: 'Admins' }))

    expect(screen.getByTestId('ethesis-admin-page')).toBeInTheDocument()
    expect(
      screen.queryByText('New  theses submitted to Etheses')
    ).not.toBeInTheDocument()
  })

  it('hides the admins tab for non-admin users even if the URL requests it', () => {
    useLoggedInUserMock.mockReturnValue({
      user: { isAdmin: false, ethesisAdmin: true },
    })

    render(
      <MemoryRouter initialEntries={['/ethesis?tab=admins']}>
        <Ethesis />
      </MemoryRouter>
    )

    expect(
      screen.queryByRole('tab', { name: 'Admins' })
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('tab', { name: 'Overview', selected: true })
    ).toBeInTheDocument()
    expect(screen.queryByTestId('ethesis-admin-page')).not.toBeInTheDocument()
  })
})
