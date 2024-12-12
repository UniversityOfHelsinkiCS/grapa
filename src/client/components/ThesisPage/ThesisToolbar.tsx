import { useTranslation } from 'react-i18next'
import { Button, Box, FormControlLabel, Switch } from '@mui/material'
import {
  GridSlotProps,
  GridToolbarContainer,
  GridToolbarFilterButton,
  useGridApiContext,
} from '@mui/x-data-grid'

import useLoggedInUser from '../../hooks/useLoggedInUser'
import useUserThesesTableFilterMutation from '../../hooks/useUserThesesTableFilterMutation'

const ThesisToolbar = (props: GridSlotProps['toolbar']) => {
  const apiRef = useGridApiContext()
  const { t } = useTranslation()
  const { user } = useLoggedInUser()

  const { mutateAsync: applyFilters } = useUserThesesTableFilterMutation()

  const {
    createNewThesis,
    toggleShowOnlyOwnTheses,
    showOnlyOwnTheses,
    noOwnThesesSwitch,
  } = props
  console.log(noOwnThesesSwitch)

  const handleNewThesis = () => {
    createNewThesis()
  }

  const handleSaveFilters = async () => {
    const { filter } = apiRef.current.exportState()

    await applyFilters({ thesesTableFilters: filter.filterModel })
  }

  return (
    <GridToolbarContainer
      sx={{ p: 2, alignItems: 'center', justifyContent: 'space-between' }}
    >
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
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
        {!noOwnThesesSwitch && user?.isAdmin && (
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
        {Boolean(
          !noOwnThesesSwitch &&
            !user?.isAdmin &&
            user?.managedProgramIds?.length
        ) && (
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
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <GridToolbarFilterButton />
        <Button
          size="small"
          sx={{
            fontSize: '12px',
          }}
          onClick={handleSaveFilters}
        >
          {t('thesesTableToolbar:saveFiltersButton')}
        </Button>
      </Box>
    </GridToolbarContainer>
  )
}

export default ThesisToolbar
