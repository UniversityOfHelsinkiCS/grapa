/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'

import initializeI18n from '../../util/il18n'

const mockUsePrograms = jest.fn().mockReturnValue({
  isLoading: false,
  programs: [
    {
      id: 'program-managed-favorite',
      isFavorite: true,
      isManaged: true,
      name: { en: 'Managed favorite', fi: 'Hallittu suosikki' },
    },
    {
      id: 'program-managed',
      isFavorite: false,
      isManaged: true,
      name: { en: 'Managed', fi: 'Hallittu' },
    },
    {
      id: 'program-unmanaged',
      isFavorite: false,
      isManaged: false,
      name: { en: 'Unmanaged', fi: 'Hallitsematon' },
    },
  ],
})

jest.unstable_mockModule('./src/client/hooks/usePrograms', () => ({
  default: mockUsePrograms,
}))

jest.unstable_mockModule('./src/client/hooks/useLoggedInUser', () => ({
  default: jest.fn().mockReturnValue({
    user: {
      favoriteProgramIds: ['program-managed-favorite'],
    },
    isLoading: false,
  }),
}))

jest.unstable_mockModule('./src/client/hooks/useUserProgramsMutation', () => ({
  default: jest.fn().mockReturnValue({
    mutateAsync: jest.fn(),
  }),
}))

jest.unstable_mockModule('notistack', () => ({
  enqueueSnackbar: jest.fn(),
}))

jest.unstable_mockModule('@mui/icons-material/Bookmark', () => ({
  default: jest.fn().mockReturnValue('BookmarkIcon'),
}))

const FavoritePrograms = (await import('./FavoritePrograms')).default

describe('FavoritePrograms', () => {
  beforeEach(() => {
    initializeI18n()
    mockUsePrograms.mockClear()
    mockUsePrograms.mockReturnValue({
      isLoading: false,
      programs: [
        {
          id: 'program-managed-favorite',
          isFavorite: true,
          isManaged: true,
          name: { en: 'Managed favorite', fi: 'Hallittu suosikki' },
        },
        {
          id: 'program-managed',
          isFavorite: false,
          isManaged: true,
          name: { en: 'Managed', fi: 'Hallittu' },
        },
        {
          id: 'program-unmanaged',
          isFavorite: false,
          isManaged: false,
          name: { en: 'Unmanaged', fi: 'Hallitsematon' },
        },
      ],
    })
  })

  it('requests only managed programs for the user settings list', () => {
    render(<FavoritePrograms />)

    expect(mockUsePrograms).toHaveBeenCalledWith({ includeNotManaged: true })
    expect(screen.getByText('Hallittu suosikki')).toBeInTheDocument()
    expect(screen.getByText('Hallittu')).toBeInTheDocument()
    expect(screen.queryByText('Hallitsematon')).not.toBeInTheDocument()
  })
})
