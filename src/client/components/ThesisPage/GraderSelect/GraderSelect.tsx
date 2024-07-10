import React from 'react'
import { Alert, AlertTitle, Stack, Typography } from '@mui/material'
import { User, GraderData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import SingleGraderSelect from './SingleGraderSelect'
import NewPersonControls from '../NewPersonControls'
import ExternalPersonInput from '../ExternalPerson'

const GraderSelect: React.FC<{
  errors: ZodIssue[]
  setErrors: (errors: ZodIssue[]) => void
  graderSelections: GraderData[]
  setGraderSelections: (newAuthors: GraderData[]) => void
}> = ({ errors, setErrors, graderSelections, setGraderSelections }) => {
  const { t } = useTranslation()

  const handleChange = (index: number, grader: Partial<User>) => {
    const updatedSelections = [...graderSelections]

    updatedSelections[index].user = grader
    updatedSelections[index].isPrimaryGrader = index === 0
    setGraderSelections(updatedSelections)

    const updatedErrors = errors.filter(
      (error) => !error.path.join('-').startsWith(`graders-${index}-user`)
    )
    setErrors(updatedErrors)
  }

  const handleAddGrader = (isExternal: boolean) => {
    const updatedSelections = [
      graderSelections[0],
      { user: null, isPrimaryGrader: false, isExternal },
    ]

    setGraderSelections(updatedSelections)
  }

  const handleRemoveGrader = (index: number) => {
    const initialSelections = [...graderSelections]
    initialSelections.splice(index, 1)
    if (initialSelections.length === 0) return // Do not allow removing all graders

    setGraderSelections(initialSelections)
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

      <Alert
        id="grader-select-instructions"
        severity="info"
        variant="outlined"
        sx={{ whiteSpace: 'pre-line' }}
      >
        <AlertTitle>{t('thesisForm:graderInstructions:title')}</AlertTitle>
        {t('thesisForm:graderInstructions:content')}
      </Alert>

      {graderSelections.map((selection, index) => {
        const { isExternal } = selection

        if (isExternal) {
          return (
            <ExternalPersonInput
              key={selection.user?.id ?? `grader-${index}`}
              index={index}
              inputGroup="graders"
              selection={selection}
              handlePersonChange={(value) => handleChange(index, value)}
              handleRemovePerson={() => handleRemoveGrader(index)}
              inputErrors={{
                firstName: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') === `graders-${index}-user-firstName`
                  )?.message
                ),
                lastName: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') === `graders-${index}-user-lastName`
                  )?.message
                ),
                email: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') === `graders-${index}-user-email`
                  )?.message
                ),
                affiliation: t(
                  errors.find(
                    (error) =>
                      error.path.join('-') ===
                      `graders-${index}-user-affiliation`
                  )?.message
                ),
              }}
              inputProps={{
                required: false,
                'aria-describedby': 'grader-select-instructions',
              }}
            />
          )
        }

        return (
          <SingleGraderSelect
            key={selection.user?.id ?? `grader-${index}`}
            index={index}
            selection={selection}
            handleGraderChange={(grader) => handleChange(index, grader)}
            handleRemoveGrader={() => handleRemoveGrader(index)}
            inputProps={{
              required: index === 0,
              helperText: t(
                errors.find(
                  (error) => error.path.join('-') === `graders-${index}-user`
                )?.message
              ),
              error: Boolean(
                errors.find(
                  (error) => error.path.join('-') === `graders-${index}-user`
                )
              ),
              'aria-describedby': 'grader-select-instructions',
            }}
            iconButtonProps={{
              disabled: index === 0,
            }}
          />
        )
      })}

      {graderSelections.length < 2 && (
        <NewPersonControls
          personGroup="grader"
          options={[
            { label: t('thesisForm:addPrimaryGrader'), isExternal: false },
            { label: t('thesisForm:addSecondaryGrader'), isExternal: true },
          ]}
          handleAddPerson={handleAddGrader}
        />
      )}
    </Stack>
  )
}

export default GraderSelect
