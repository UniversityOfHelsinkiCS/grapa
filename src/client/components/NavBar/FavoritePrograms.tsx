import sortBy from 'lodash-es/sortBy'
import { useTranslation } from 'react-i18next'
import { ProgramData, TranslatedName } from '@backend/types'
import {
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
  Tooltip,
} from '@mui/material'
import BookmarkIcon from '@mui/icons-material/Bookmark'

import usePrograms from '../../hooks/usePrograms'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import useUserProgramsMutation from '../../hooks/useUserProgramsMutation'

const getSortedPrograms = (programs: ProgramData[], language: string) =>
  sortBy(programs, (program) => program.name[language as keyof TranslatedName])

const FavoritePrograms = () => {
  const { t, i18n } = useTranslation()

  const { user, isLoading: userLoading } = useLoggedInUser()
  const { programs, isLoading: programsLoading } = usePrograms({
    includeNotManaged: true,
  })

  const mutation = useUserProgramsMutation()

  const { language } = i18n

  if (!user || !programs || userLoading || programsLoading) return null

  const favoritePrograms = programs.filter((program) =>
    user.favoriteProgramIds.includes(program.id)
  )
  const otherPrograms = programs.filter(
    (program) => !user.favoriteProgramIds.includes(program.id)
  )

  const sortedFavoritePrograms = getSortedPrograms(favoritePrograms, language)
  const sortedOtherPrograms = getSortedPrograms(otherPrograms, language)

  const handleUpdateFavoritePrograms = (programId: string) => {
    const newFavoriteProgramIds = user.favoriteProgramIds.includes(programId)
      ? user.favoriteProgramIds.filter((id) => id !== programId)
      : [...user.favoriteProgramIds, programId]

    try {
      mutation.mutateAsync({ favoriteProgramIds: newFavoriteProgramIds })
      console.log('SUCCESS: updated favorite programs')
    } catch (error) {
      console.error('ERROR: updating favorite programs', error)
    }
  }

  return (
    <>
      <ListSubheader disableSticky>
        {t('navbar:favProgramsSubHeader')}
      </ListSubheader>
      {sortedFavoritePrograms.map((program) => (
        <Tooltip
          key={program.id}
          describeChild
          title={t('navbar:removeFromFavorites')}
        >
          <MenuItem
            data-cy={`program-option-${program.id}`}
            onClick={() => handleUpdateFavoritePrograms(program.id)}
            value={program.id}
            sx={{ justifyContent: 'space-between', px: 4 }}
          >
            <ListItemIcon>
              <BookmarkIcon fontSize="small" color="primary" />
            </ListItemIcon>
            <ListItemText
              primary={program.name[language as keyof TranslatedName]}
            />
          </MenuItem>
        </Tooltip>
      ))}

      {sortedOtherPrograms.map((program) => (
        <Tooltip
          key={program.id}
          describeChild
          title={t('navbar:addToFavorites')}
        >
          <MenuItem
            data-cy={`program-option-${program.id}`}
            onClick={() => handleUpdateFavoritePrograms(program.id)}
            value={program.id}
            sx={{ justifyContent: 'space-between', px: 4 }}
          >
            <ListItemText
              sx={{ ml: '36px' }}
              primary={program.name[language as keyof TranslatedName]}
            />
          </MenuItem>
        </Tooltip>
      ))}
    </>
  )
}

export default FavoritePrograms