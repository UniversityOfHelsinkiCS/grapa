import { useTranslation } from 'react-i18next'
import { Button, Box } from '@mui/material'
import { GridSlotProps } from '@mui/x-data-grid'

const ThesisToolbar = (props: GridSlotProps['toolbar']) => {
  const { t } = useTranslation()

  const { createNewThesis } = props

  const handleNewThesis = () => {
    createNewThesis()
  }

  return (
    <Box sx={{ p: 2 }}>
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
        {t('newThesisButton')}
      </Button>
    </Box>
  )
}

export default ThesisToolbar
