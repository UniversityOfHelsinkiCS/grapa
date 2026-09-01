import React from 'react'
import { Stack, TextField, IconButton, Typography } from '@mui/material'
import { AnyFieldApi } from '@tanstack/react-form'
import { useAppFormContext } from '../thesisFormContext'
import DeleteIcon from '@mui/icons-material/Delete'
import { useTranslation } from 'react-i18next'
import PercentageInput from '../PercentageInput'
import { PersonType, BasePersonSelection } from './PersonSelectionList'

interface ExternalPersonSelectProps {
  type: PersonType
  index: number
  selection: BasePersonSelection
  field: AnyFieldApi
  disabledMode?: boolean
  onRemove: () => void
}

const ExternalPersonSelect = ({
  type,
  index,
  selection,
  field,
  disabledMode,
  onRemove,
}: ExternalPersonSelectProps) => {
  const { t } = useTranslation()
  const form = useAppFormContext()

  const isSupervisor = type === 'supervisor'
  const isSeminarSupervisor = type === 'seminarSupervisor'

  const legendLocKey = isSupervisor
    ? 'supervisor'
    : isSeminarSupervisor
      ? 'seminarSupervisor'
      : 'grader'

  const userBase = `${field.name}[${index}].user`

  const handleUserFieldChange = (
    handleChange: (value: string) => void,
    fieldName: string,
    value: string
  ) => {
    const currentArr = field.state.value || []
    if (
      !currentArr[index] ||
      selection.creationTimeIdentifier === 'default-empty'
    ) {
      const newArr = [...currentArr]
      newArr[index] = {
        ...selection,
        creationTimeIdentifier: undefined,
        user: { ...selection.user, [fieldName]: value },
      }
      field.setValue(newArr)
    } else {
      handleChange(value)
    }
  }

  const handlePercentageChange = (
    handleChange: (value: number) => void,
    value: number
  ) => {
    const currentArr = field.state.value || []
    if (
      !currentArr[index] ||
      selection.creationTimeIdentifier === 'default-empty'
    ) {
      const newArr = [...currentArr]
      newArr[index] = {
        ...selection,
        creationTimeIdentifier: undefined,
        percentage: value,
      }
      field.setValue(newArr)
    } else {
      handleChange(value)
    }
  }

  return (
    <Stack spacing={1} direction="row">
      <Stack
        spacing={1}
        direction="column"
        component="fieldset"
        sx={{
          borderColor: 'secondary',
          borderWidth: '1px',
          borderStyle: 'solid',
          flexGrow: 1,
        }}
      >
        <Typography
          component="legend"
          variant="caption"
          color="text.secondary"
          sx={{ mx: '2rem' }}
        >
          {t(legendLocKey, { index: index + 1 })} *
        </Typography>

        <Stack spacing={1} direction="row">
          <form.Field name={`${userBase}.firstName`}>
            {(f: AnyFieldApi) => (
              <TextField
                required
                disabled={disabledMode}
                margin="dense"
                label={t('thesisForm:firstName')}
                value={f.state.value ?? ''}
                onChange={(e) =>
                  handleUserFieldChange(
                    f.handleChange,
                    'firstName',
                    e.target.value
                  )
                }
                fullWidth
                variant="outlined"
                error={f.state.meta.errors.length > 0}
                helperText={
                  f.state.meta.errors.length > 0
                    ? t(f.state.meta.errors[0])
                    : undefined
                }
              />
            )}
          </form.Field>

          <form.Field name={`${userBase}.lastName`}>
            {(f: AnyFieldApi) => (
              <TextField
                required
                disabled={disabledMode}
                margin="dense"
                label={t('thesisForm:lastName')}
                value={f.state.value ?? ''}
                onChange={(e) =>
                  handleUserFieldChange(
                    f.handleChange,
                    'lastName',
                    e.target.value
                  )
                }
                fullWidth
                variant="outlined"
                error={f.state.meta.errors.length > 0}
                helperText={
                  f.state.meta.errors.length > 0
                    ? t(f.state.meta.errors[0])
                    : undefined
                }
              />
            )}
          </form.Field>
        </Stack>

        <Stack spacing={1} direction="row">
          <form.Field name={`${userBase}.email`}>
            {(f: AnyFieldApi) => (
              <TextField
                required
                disabled={disabledMode}
                margin="dense"
                label={t('thesisForm:email')}
                value={f.state.value ?? ''}
                onChange={(e) =>
                  handleUserFieldChange(f.handleChange, 'email', e.target.value)
                }
                fullWidth
                variant="outlined"
                error={f.state.meta.errors.length > 0}
                helperText={
                  f.state.meta.errors.length > 0
                    ? t(f.state.meta.errors[0])
                    : undefined
                }
              />
            )}
          </form.Field>

          <form.Field name={`${userBase}.affiliation`}>
            {(f: AnyFieldApi) => (
              <TextField
                required
                disabled={disabledMode}
                margin="dense"
                label={t('thesisForm:affiliation')}
                value={f.state.value ?? ''}
                onChange={(e) =>
                  handleUserFieldChange(
                    f.handleChange,
                    'affiliation',
                    e.target.value
                  )
                }
                fullWidth
                variant="outlined"
                error={f.state.meta.errors.length > 0}
                helperText={
                  f.state.meta.errors.length > 0
                    ? t(f.state.meta.errors[0])
                    : undefined
                }
              />
            )}
          </form.Field>

          {isSupervisor && (
            <form.Field name={`${field.name}[${index}].percentage`}>
              {(f: AnyFieldApi) => (
                <PercentageInput
                  label={t('thesisForm:selectSupervisorPercentage')}
                  value={f.state.value ?? 0}
                  onChange={(val) =>
                    handlePercentageChange(f.handleChange, val)
                  }
                  percentageInputProps={{
                    required: true,
                    error: f.state.meta.errors.length > 0,
                  }}
                />
              )}
            </form.Field>
          )}
        </Stack>
      </Stack>

      <IconButton
        data-testid={`remove-${type}-button`}
        type="button"
        onClick={() => onRemove()}
        color="error"
        size="small"
      >
        <DeleteIcon />
      </IconButton>
    </Stack>
  )
}

export default ExternalPersonSelect
