import React from 'react'
import { Alert, AlertTitle, Stack, Typography } from '@mui/material'
import { AuthorData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import SingleGraderSelect from './SingleGraderSelect'

const GraderSelect: React.FC<{
  graderSelections: AuthorData[]
  setGraderSelections: (newAuthors: AuthorData[]) => void
}> = ({ graderSelections, setGraderSelections }) => {
  const { t } = useTranslation()

  const handleChange = (index: number, grader: AuthorData) => {
    const updatedSelections = [...graderSelections]
    updatedSelections[index] = grader
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

      {graderSelections.map((selection, index) => {
        const requiredField = index === 0
        const helperText =
          index === 0
            ? t('thesisForm:graderInstructions:professor')
            : t('thesisForm:graderInstructions:phd')

        return (
          <SingleGraderSelect
            key={selection?.id ?? `index-${index}`}
            index={index + 1}
            selection={selection}
            handleGraderChange={(grader) => handleChange(index, grader)}
            inputProps={{ required: requiredField, helperText }}
          />
        )
      })}
    </Stack>
  )
}

export default GraderSelect
