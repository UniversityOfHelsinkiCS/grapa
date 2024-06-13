import React from 'react'
import { Alert, AlertTitle, Stack, Typography } from '@mui/material'
import { AuthorData, GraderData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import SingleGraderSelect from './SingleGraderSelect'

const GraderSelect: React.FC<{
  graderSelections: GraderData[]
  setGraderSelections: (newAuthors: GraderData[]) => void
}> = ({ graderSelections, setGraderSelections }) => {
  const { t } = useTranslation()

  const [
    primaryGrader = { user: null, isPrimaryGrader: true },
    secondaryGrader = { user: null, isPrimaryGrader: false },
  ] = graderSelections

  const handleChange = (index: number, grader: AuthorData) => {
    const updatedSelections = [...graderSelections]
    const updatedGrader = { user: grader, isPrimaryGrader: index === 0 }
    updatedSelections[index] = updatedGrader
    setGraderSelections(updatedSelections)
  }

  return (
    <Stack
      data-testid="grader-select"
      spacing={3}
      sx={{
        borderStyle: 'none',
        borderWidth: '1px',
        borderTop: '1px solid',
      }}
      component="fieldset"
    >
      <Typography component="legend" sx={{ px: '1rem' }}>
        {t('thesisForm:graders')}
      </Typography>

      <Alert severity="info" variant="outlined">
        <AlertTitle>{t('thesisForm:graderInstructions:title')}</AlertTitle>
        {t('thesisForm:graderInstructions:content')}
      </Alert>

      <SingleGraderSelect
        key={primaryGrader?.user?.id ?? 'grader-0'}
        index={1}
        selection={primaryGrader}
        handleGraderChange={(grader) => handleChange(0, grader)}
        inputProps={{
          required: true,
          helperText: t('thesisForm:graderInstructions:professor'),
        }}
      />

      <SingleGraderSelect
        key={secondaryGrader?.user?.id ?? 'grader-1'}
        index={2}
        selection={secondaryGrader}
        handleGraderChange={(grader) => handleChange(1, grader)}
        inputProps={{
          required: false,
          helperText: t('thesisForm:graderInstructions:phd'),
        }}
      />
    </Stack>
  )
}

export default GraderSelect
