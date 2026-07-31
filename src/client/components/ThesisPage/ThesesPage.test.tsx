import { describe, it, expect, beforeEach, vi } from 'vitest'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

const mockThesisEditForm: any = vi.fn(({ programs, initialThesis }) => (
  <div data-testid="thesis-edit-form">
    <span data-testid="thesis-edit-form-program-ids">
      {programs.map((program: any) => program.id).join(',')}
    </span>
    <span data-testid="thesis-edit-form-selected-program">
      {initialThesis.programId}
    </span>
  </div>
))

vi.mock('../../hooks/useTheses', () => ({
  usePaginatedTheses: vi.fn().mockReturnValue({
    theses: [],
    totalCount: 0,
    isLoading: false,
  }),
  useExportThesesCsv: vi.fn().mockReturnValue({
    exportCsv: vi.fn(),
  }),
}))

vi.mock('../../hooks/useLoggedInUser', () => ({
  default: vi.fn().mockReturnValue({
    user: {
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false,
      managedProgramIds: ['program-managed-favorite', 'program-managed'],
      thesesTableFilters: null,
    },
    isLoading: false,
  }),
}))

vi.mock('../../hooks/useThesesMutation', () => ({
  useCreateThesisMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useDeleteThesisMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useEditThesisMutation: vi.fn().mockReturnValue({ mutateAsync: vi.fn() }),
  useChangeThesisStatusMutation: vi
    .fn()
    .mockReturnValue({ mutateAsync: vi.fn() }),
}))

vi.mock('../../hooks/usePrograms', () => ({
  default: vi.fn().mockReturnValue({
    isLoading: false,
    programs: [
      {
        id: 'program-unmanaged',
        isFavorite: true,
        isManaged: false,
        name: { en: 'Unmanaged', fi: 'Hallitsematon' },
        studyTracks: [{ id: 'track-unmanaged', name: { en: 'U', fi: 'U' } }],
      },
      {
        id: 'program-managed',
        isFavorite: false,
        isManaged: true,
        name: { en: 'Managed', fi: 'Hallittu' },
        studyTracks: [{ id: 'track-managed', name: { en: 'M', fi: 'M' } }],
      },
      {
        id: 'program-managed-favorite',
        isFavorite: true,
        isManaged: true,
        name: { en: 'Managed favorite', fi: 'Hallittu suosikki' },
        studyTracks: [
          { id: 'track-managed-favorite', name: { en: 'F', fi: 'F' } },
        ],
      },
    ],
  }),
}))

vi.mock('./ThesisEditForm', () => ({
  default: mockThesisEditForm,
}))

vi.mock('./ThesisTable', () => ({
  DEFAULT_PAGE_SIZE: 25,
  default: vi.fn(({ initializeNewThesis }) => (
    <button data-testid="create-new-thesis" onClick={initializeNewThesis}>
      Create new thesis
    </button>
  )),
}))

vi.mock('./ViewThesisFooter', () => ({
  default: vi.fn(() => null),
}))

vi.mock('@mui/icons-material/PriorityHigh', () => ({
  default: vi.fn().mockReturnValue('PriorityHighIcon'),
}))

const ThesesPage = (await import('./ThesesPage')).default

describe('ThesesPage', () => {
  beforeEach(() => {
    void initializeI18n()
    mockThesisEditForm.mockClear()
  })

  it('shows only managed programs when creating a thesis', async () => {
    const user = userEvent.setup()

    render(<ThesesPage />)

    await user.click(screen.getByTestId('create-new-thesis'))

    await waitFor(() => {
      expect(screen.getByTestId('thesis-edit-form')).toBeInTheDocument()
    })

    expect(
      screen.getByTestId('thesis-edit-form-program-ids')
    ).toHaveTextContent('program-managed,program-managed-favorite')
    expect(
      screen.getByTestId('thesis-edit-form-selected-program')
    ).toHaveTextContent('program-managed-favorite')
  })
})
