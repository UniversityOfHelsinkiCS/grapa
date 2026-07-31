import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import initializeI18n from '../../util/il18n'

const useLoggedInUserMock = vi.fn()

vi.mock('../../hooks/useLoggedInUser', () => ({
  default: useLoggedInUserMock,
}))

vi.mock('../ThesisPage/ThesesPage', () => ({
  default: vi.fn(() => <div data-testid="theses-page">Theses Page</div>),
}))

vi.mock('./AdminPage', () => ({
  default: vi.fn(({ disableContainer, hideTitle }) => (
    <div data-testid="ethesis-admin-page">
      {`${String(disableContainer)}-${String(hideTitle)}`}
    </div>
  )),
}))

const Ethesis = (await import('./index')).default

describe('Ethesis', () => {
  beforeEach(() => {
    void initializeI18n()
    useLoggedInUserMock.mockReset()
  })

  it('shows the overview tab by default', () => {
    vi.mocked(useLoggedInUserMock).mockReturnValue({
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
    expect(screen.getByTestId('theses-page')).toBeInTheDocument()
    expect(screen.queryByTestId('ethesis-admin-page')).not.toBeInTheDocument()
  })

  it('shows the admins tab content when opened from the admins tab URL', () => {
    vi.mocked(useLoggedInUserMock).mockReturnValue({
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
    vi.mocked(useLoggedInUserMock).mockReturnValue({
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
    expect(screen.queryByTestId('theses-page')).not.toBeInTheDocument()
  })

  it('hides the admins tab for non-admin users even if the URL requests it', () => {
    vi.mocked(useLoggedInUserMock).mockReturnValue({
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
