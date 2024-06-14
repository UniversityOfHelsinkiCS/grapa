import React from 'react'
import { Alert, AlertTitle, Stack, Typography } from '@mui/material'
import { AuthorData, GraderData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import SingleGraderSelect from './SingleGraderSelect'

const GraderSelect: React.FC<{
  errors: ZodIssue[]
  graderSelections: GraderData[]
  setGraderSelections: (newAuthors: GraderData[]) => void
}> = ({ errors, graderSelections, setGraderSelections }) => {
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

  const professorInputError = errors.find(
    (error) => error.path.join('-') === 'graders-0-user'
  )
  const phdInputError = errors.find(
    (error) => error.path.join('-') === 'graders-1-user'
  )

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
        index={0}
        selection={primaryGrader}
        handleGraderChange={(grader) => handleChange(0, grader)}
        inputProps={{
          required: true,
          helperText: professorInputError
            ? professorInputError.message
            : t('thesisForm:graderInstructions:professor'),
          error: Boolean(professorInputError),
        }}
      />

      <SingleGraderSelect
        key={secondaryGrader?.user?.id ?? 'grader-1'}
        index={1}
        selection={secondaryGrader}
        handleGraderChange={(grader) => handleChange(1, grader)}
        inputProps={{
          required: false,
          helperText: phdInputError
            ? phdInputError.message
            : t('thesisForm:graderInstructions:phd'),
          error: Boolean(phdInputError),
        }}
      />
    </Stack>
  )
}

export default GraderSelect
