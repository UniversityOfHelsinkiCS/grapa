import { useTranslation } from 'react-i18next'
import { Button, Box, FormControlLabel, Switch, Stack } from '@mui/material'
import { GridSlotProps, useGridApiContext } from '@mui/x-data-grid'

import useLoggedInUser from '../../hooks/useLoggedInUser'
import useUserThesesTableFilterMutation from '../../hooks/useUserThesesTableFilterMutation'

const ThesisToolbar = (props: GridSlotProps['toolbar']) => {
  const apiRef = useGridApiContext()
  const { t } = useTranslation()
  const { user } = useLoggedInUser()

  const { mutateAsync: applyFilters } = useUserThesesTableFilterMutation()

  const { createNewThesis, toggleShowOnlyOwnTheses, showOnlyOwnTheses } = props

  const handleNewThesis = () => {
    createNewThesis()
  }

  const handleSaveFilters = async () => {
    const { filter } = apiRef.current.exportState()

    await applyFilters({ thesesTableFilters: filter.filterModel })
  }

  return (
    <Stack
      direction="row"
      sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between' }}
    >
      <Box sx={{ display: 'flex', gap: 5, alignItems: 'center' }}>
        <Button
          variant="contained"
          size="small"
          sx={{
            fontSize: '12px',
            height: 24,
            px: 2,
            borderRadius: '1rem',
            fontWeight: 700,
          }}
          onClick={handleNewThesis}
        >
          {t('thesesTableToolbar:newThesisButton')}
        </Button>
        {user?.isAdmin && (
          <FormControlLabel
            control={
              <Switch
                checked={!showOnlyOwnTheses}
                onChange={toggleShowOnlyOwnTheses}
              />
            }
            label={t('thesesTableToolbar:showAllThesesSwitch')}
          />
        )}
        {Boolean(!user?.isAdmin && user?.managedProgramIds?.length) && (
          <FormControlLabel
            control={
              <Switch
                checked={!showOnlyOwnTheses}
                onChange={toggleShowOnlyOwnTheses}
              />
            }
            label={t('thesesTableToolbar:showManagedProgramsThesesSwitch')}
          />
        )}
      </Box>

      <Button
        variant="outlined"
        size="small"
        sx={{
          fontSize: '12px',
          height: 24,
          px: 2,
          borderRadius: '1rem',
          fontWeight: 700,
        }}
        onClick={handleSaveFilters}
      >
        {t('thesesTableToolbar:saveFiltersButton')}
      </Button>
    </Stack>
  )
}

export default ThesisToolbar
