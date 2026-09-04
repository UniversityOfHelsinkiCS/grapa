import React from 'react'
import {
  Autocomplete,
  Stack,
  TextField,
  FormControl,
  IconButton,
  Box,
  Checkbox,
  Tooltip,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import DeleteIcon from '@mui/icons-material/Delete'
import Star from '@mui/icons-material/Star'
import StarOutline from '@mui/icons-material/StarBorder'
import { AnyFieldApi } from '@tanstack/react-form'
import { useAppFormContext } from '../thesisFormContext'
import useUsers from '../../../hooks/useUsers'
import { useDebounce } from '../../../hooks/useDebounce'
import PercentageInput from '../PercentageInput'
import { PersonType, BasePersonSelection } from './PersonSelectionList'
import { ErrorPath, ThesisFormErrors } from '../thesisFormErrors'
import { EmployeeUser as User } from '@backend/validators/userResponse'

interface SinglePersonSelectProps {
  type: PersonType
  index: number
  selection: BasePersonSelection
  field: AnyFieldApi
  allowEmpty: boolean
  totalLength: number
  errors: ThesisFormErrors
  errorPath: ErrorPath
  onRemove: () => void
  onPrimaryChange: () => void
}

const SinglePersonSelect = ({
  type,
  index,
  selection,
  field,
  allowEmpty,
  totalLength,
  errors,
  errorPath,
  onRemove,
  onPrimaryChange,
}: SinglePersonSelectProps) => {
  const { t } = useTranslation()
  const form = useAppFormContext()
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  const isSupervisor = type === 'supervisor'
  const isGrader = type === 'grader'
  const isSeminarSupervisor = type === 'seminarSupervisor'

  const label = t(
    isSupervisor
      ? 'supervisor'
      : isGrader
        ? 'grader'
        : 'thesisForm:seminarSupervisor',
    isSeminarSupervisor ? undefined : { index: index + 1 }
  )

  const removeDisabled =
    (!allowEmpty && totalLength === 1) ||
    (totalLength > 1 &&
      type === 'supervisor' &&
      selection.isPrimarySupervisor) ||
    (totalLength > 1 && type === 'grader' && selection.isPrimaryGrader)

  const handleUserChange = (handleChange: (value: any) => void, value: any) => {
    errors.clear(...errorPath)

    const currentArr = field.state.value || []
    if (
      !currentArr[index] ||
      selection.creationTimeIdentifier === 'default-empty'
    ) {
      const newArr = [...currentArr]
      newArr[index] = {
        ...selection,
        creationTimeIdentifier: undefined,
        user: value,
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
      <form.Field name={`${field.name}[${index}].user`}>
        {(userField: AnyFieldApi) => (
          <FormControl fullWidth>
            <Autocomplete<Partial<User>>
              id={`${field.name}-${index}-user`}
              noOptionsText={
                userSearch.length < 5
                  ? t('userSearchNoOptions')
                  : t('userSearchExtPersonHint')
              }
              data-testid={`${type}-select-input-${index + 1}`}
              disablePortal
              options={users ?? []}
              getOptionLabel={(user) =>
                `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''}`
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={label}
                  required
                  {...errors.fieldProps(...errorPath)}
                />
              )}
              filterOptions={(x) => x}
              inputValue={userSearch}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              value={userField.state.value}
              onChange={(_, value) =>
                handleUserChange(userField.handleChange, value)
              }
              onInputChange={(_, value) => setUserSearch(value)}
            />
          </FormControl>
        )}
      </form.Field>

      {isSupervisor && (
        <form.Field name={`${field.name}[${index}].percentage`}>
          {(percentageField: AnyFieldApi) => (
            <PercentageInput
              label={t('thesisForm:selectSupervisorPercentage')}
              value={percentageField.state.value ?? 0}
              onChange={(val) =>
                handlePercentageChange(percentageField.handleChange, val)
              }
              percentageInputProps={{
                required: true,
                error: errors.has(field.name, index, 'percentage'),
              }}
            />
          )}
        </form.Field>
      )}

      {isSupervisor && (
        <Tooltip
          title={
            selection.isPrimarySupervisor
              ? t('thesisForm:primarySupervisor')
              : t('thesisForm:setPrimarySupervisor')
          }
        >
          <FormControl
            error={false} // Would need custom primary supervisor error logic here if needed
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Checkbox
              icon={<StarOutline color="primary" />}
              checkedIcon={<Star />}
              checked={selection.isPrimarySupervisor}
              onChange={onPrimaryChange}
            />
          </FormControl>
        </Tooltip>
      )}

      {(!isGrader ||
        !selection.isPrimaryGrader ||
        (allowEmpty && totalLength === 1)) && (
        <Tooltip
          title={
            removeDisabled
              ? isSupervisor
                ? t('thesisForm:primarySupervisorDeleteError')
                : ''
              : `${t('removeButton')} ${label}`
          }
        >
          <Box component="span" sx={{ alignContent: 'center' }}>
            <IconButton
              data-testid={`remove-${type}-button`}
              type="button"
              onClick={() => onRemove()}
              color="error"
              size="small"
              disabled={removeDisabled}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Tooltip>
      )}
    </Stack>
  )
}

export default SinglePersonSelect
