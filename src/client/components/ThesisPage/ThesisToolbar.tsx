import { useTranslation } from 'react-i18next'
import { Button, Box, FormControlLabel, Switch } from '@mui/material'
import { GridSlotProps } from '@mui/x-data-grid'

import useLoggedInUser from '../../hooks/useLoggedInUser'

const ThesisToolbar = (props: GridSlotProps['toolbar']) => {
  const { t } = useTranslation()
  const { user } = useLoggedInUser()

  const { createNewThesis, toggleShowOnlyOwnTheses, showOnlyOwnTheses } = props

  const handleNewThesis = () => {
    createNewThesis()
  }

  return (
    <Box sx={{ p: 2, display: 'flex', gap: 5, alignItems: 'center' }}>
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
              checked={showOnlyOwnTheses}
              onChange={toggleShowOnlyOwnTheses}
            />
          }
          label={t('thesesTableToolbar:showAllThesesSwitch')}
        />
      )}
      {!user?.isAdmin && user?.managedProgramIds?.length && (
        <FormControlLabel
          control={
            <Switch
              checked={showOnlyOwnTheses}
              onChange={toggleShowOnlyOwnTheses}
            />
          }
          label={t('thesesTableToolbar:showManagedProgramsThesesSwitch')}
        />
      )}
    </Box>
  )
}

export default ThesisToolbar
