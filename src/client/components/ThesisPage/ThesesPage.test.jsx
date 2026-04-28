/**
 * @jest-environment jsdom
 */
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

const mockThesisEditForm = jest.fn(({ programs, initialThesis }) => (
  <div data-testid="thesis-edit-form">
    <span data-testid="thesis-edit-form-program-ids">
      {programs.map((program) => program.id).join(',')}
    </span>
    <span data-testid="thesis-edit-form-selected-program">
      {initialThesis.programId}
    </span>
  </div>
))

jest.unstable_mockModule('./src/client/hooks/useTheses', () => ({
  usePaginatedTheses: jest.fn().mockReturnValue({
    theses: [],
    totalCount: 0,
    isLoading: false,
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: jest.fn().mockReturnValue({
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

jest.unstable_mockModule('./src/client/hooks/useThesesMutation', () => ({
  useCreateThesisMutation: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
  }),
  useDeleteThesisMutation: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
  }),
  useEditThesisMutation: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
  }),
}))

jest.unstable_mockModule('./src/client/hooks/usePrograms', () => ({
  default: jest.fn().mockReturnValue({
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

jest.unstable_mockModule(
  './src/client/components/ThesisPage/ThesisEditForm',
  () => ({
    default: mockThesisEditForm,
  })
)

jest.unstable_mockModule(
  './src/client/components/ThesisPage/ThesisToolbar',
  () => ({
    default: jest.fn(({ createNewThesis }) => (
      <button data-testid="create-new-thesis" onClick={createNewThesis}>
        Create new thesis
      </button>
    )),
  })
)

jest.unstable_mockModule(
  './src/client/components/ThesisPage/ViewThesisFooter',
  () => ({
    default: jest.fn(() => null),
  })
)

jest.unstable_mockModule(
  './src/client/components/ThesisPage/Filters/StatusFilter',
  () => ({
    default: jest.fn(() => null),
  })
)

jest.unstable_mockModule(
  './src/client/components/Common/DeleteConfirmation',
  () => ({
    default: jest.fn(() => null),
  })
)

jest.unstable_mockModule(
  './src/client/components/Common/EthesisConfirmation',
  () => ({
    default: jest.fn(() => null),
  })
)

jest.unstable_mockModule('@mui/x-data-grid', () => ({
  DataGrid: jest.fn(({ slots, slotProps }) => {
    const Toolbar = slots?.toolbar

    return (
      <div data-testid="data-grid">
        {Toolbar ? <Toolbar {...slotProps.toolbar} /> : null}
      </div>
    )
  }),
  getGridStringOperators: jest.fn().mockReturnValue([{ value: 'contains' }]),
  useGridApiRef: jest.fn().mockReturnValue({
    current: {
      restoreState: jest.fn(),
      exportState: jest.fn().mockReturnValue({
        filter: { filterModel: { items: [] } },
      }),
    },
  }),
}))

jest.unstable_mockModule('@mui/x-data-grid/locales', () => ({
  enUS: {
    components: {
      MuiDataGrid: {
        defaultProps: {
          localeText: {},
        },
      },
    },
  },
  fiFI: {
    components: {
      MuiDataGrid: {
        defaultProps: {
          localeText: {},
        },
      },
    },
  },
}))

jest.unstable_mockModule('@mui/icons-material/PriorityHigh', () => ({
  default: jest.fn().mockReturnValue('PriorityHighIcon'),
}))

const ThesesPage = (await import('./ThesesPage')).default

describe('ThesesPage', () => {
  beforeEach(() => {
    initializeI18n()
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
