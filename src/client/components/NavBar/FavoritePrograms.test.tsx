import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MenuList } from '@mui/material'

import initializeI18n from '../../util/il18n'

const mockUsePrograms: any = vi.fn().mockReturnValue({
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

vi.mock('../../hooks/usePrograms', () => ({
  default: mockUsePrograms,
}))

vi.mock('../../hooks/useLoggedInUser', () => ({
  default: vi.fn().mockReturnValue({
    user: {
      favoriteProgramIds: ['program-managed-favorite'],
    },
    isLoading: false,
  }),
}))

vi.mock('../../hooks/useUserProgramsMutation', () => ({
  default: vi.fn().mockReturnValue({
    mutateAsync: vi.fn(),
  }),
}))

vi.mock('notistack', () => ({
  enqueueSnackbar: vi.fn(),
}))

vi.mock('@mui/icons-material/Bookmark', () => ({
  default: vi.fn().mockReturnValue('BookmarkIcon'),
}))

const FavoritePrograms = (await import('./FavoritePrograms')).default

describe('FavoritePrograms', () => {
  beforeEach(() => {
    initializeI18n()
    mockUsePrograms.mockClear()
    vi.mocked(mockUsePrograms).mockReturnValue({
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
    render(
      <MenuList>
        <FavoritePrograms />
      </MenuList>
    )

    expect(mockUsePrograms).toHaveBeenCalledWith({ includeNotManaged: true })
    expect(screen.getByText('Hallittu suosikki')).toBeInTheDocument()
    expect(screen.getByText('Hallittu')).toBeInTheDocument()
    expect(screen.queryByText('Hallitsematon')).not.toBeInTheDocument()
  })
})
