import {
  Autocomplete,
  FormControl,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { SeminarSupervisionData, User } from '@backend/types'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import { useDebounce } from '../../../hooks/useDebounce'
import useUsers from '../../../hooks/useUsers'
import { useState } from 'react'
import SingleSeminarSupervisorSelect from './SingleSeminarSupervisorSelect'
import NewPersonControls from '../NewPersonControls'

const SeminarSupervisorSelect: React.FC<{
  errors: ZodIssue[]
  setErrors: (errors: ZodIssue[]) => void
  seminarSupervisorSelections: SeminarSupervisionData[]
  setSeminarSupervisorSelections: (
    seminarSupervisions: SeminarSupervisionData[]
  ) => void
  allowMultiple?: boolean
}> = ({
  errors,
  setErrors,
  seminarSupervisorSelections,
  setSeminarSupervisorSelections,
  allowMultiple = false,
}) => {
  const { t } = useTranslation()
  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  const selection = seminarSupervisorSelections[0] ?? {
    user: null,
    isExternal: false,
  }

  const handleChange = (user: Partial<User> | null) => {
    setSeminarSupervisorSelections(
      user
        ? [
            {
              user,
              isExternal: false,
            },
          ]
        : []
    )

    setErrors(
      errors.filter(
        (error) =>
          !error.path.join('-').startsWith('seminarSupervisions-0-user') &&
          !error.path.join('-').endsWith('general-seminar-supervisor-error')
      )
    )
  }

  const handleSeminarSupervisorChange = (
    index: number,
    supervisor: Partial<User> | null
  ) => {
    // If the array was empty and we're showing a virtual field, initialize the array
    if (seminarSupervisorSelections.length === 0) {
      setSeminarSupervisorSelections(
        supervisor
          ? [
              {
                user: supervisor,
                isExternal: false,
              },
            ]
          : []
      )
    } else {
      const updatedSelections = [...seminarSupervisorSelections]
      updatedSelections[index].user = supervisor
      setSeminarSupervisorSelections(updatedSelections)
    }

    const updatedErrors = errors.filter(
      (error) =>
        !error.path.join('-').startsWith(`seminarSupervisions-${index}-user`)
    )
    setErrors(updatedErrors)
  }

  const handleAddSeminarSupervisor = () => {
    setSeminarSupervisorSelections([
      ...seminarSupervisorSelections,
      {
        user: null,
        isExternal: false,
      },
    ])
  }

  const handleRemoveSeminarSupervisor = (index: number) => {
    const initialSelections = [...seminarSupervisorSelections]
    initialSelections.splice(index, 1)

    // Don't allow removing the last one
    if (initialSelections.length === 0) return

    setSeminarSupervisorSelections(initialSelections)
  }

  const generalError = errors.find((error) =>
    error.path.join('-').endsWith('general-seminar-supervisor-error')
  )
  const fieldError = errors.find(
    (error) => error.path.join('-') === 'seminarSupervisions-0-user'
  )
  const errorMessage = fieldError?.message ?? generalError?.message

  // When allowMultiple is true, render multiple selects with add/remove buttons
  if (allowMultiple) {
    // Ensure at least one selection is always visible
    const selectionsToRender =
      seminarSupervisorSelections.length === 0
        ? [{ user: null, isExternal: false }]
        : seminarSupervisorSelections

    return (
      <Stack
        spacing={3}
        sx={{
          borderStyle: 'none',
          borderWidth: '1px',
          borderTop: '1px solid',
        }}
        component="fieldset"
      >
        <Typography component="legend" sx={{ px: '1rem' }}>
          {t('thesisForm:seminarSupervisor')}
        </Typography>

        {selectionsToRender.map((selection, index) => (
          <SingleSeminarSupervisorSelect
            key={selection.user?.id ?? `seminarSupervisions-${index}`}
            index={index}
            selection={selection}
            handleSeminarSupervisorChange={(value) =>
              handleSeminarSupervisorChange(index, value)
            }
            handleRemoveSeminarSupervisor={() =>
              handleRemoveSeminarSupervisor(index)
            }
            inputProps={{
              required: true,
              helperText: t(
                errors.find(
                  (error) =>
                    error.path.join('-') === `seminarSupervisions-${index}-user`
                )?.message
              ),
              error: Boolean(
                errors.find(
                  (error) =>
                    error.path.join('-') === `seminarSupervisions-${index}-user`
                )
              ),
            }}
            iconButtonProps={{
              disabled: selectionsToRender.length === 1,
            }}
          />
        ))}

        {selectionsToRender.length < 5 && (
          <NewPersonControls
            personGroup="seminar-supervisor"
            options={[
              {
                label: t('thesisForm:addSeminarSupervisor'),
                isExternal: false,
              },
            ]}
            handleAddPerson={handleAddSeminarSupervisor}
          />
        )}
      </Stack>
    )
  }

  // Default single-select behavior
  return (
    <Stack
      spacing={3}
      sx={{
        borderStyle: 'none',
        borderWidth: '1px',
        borderTop: '1px solid',
      }}
      component="fieldset"
    >
      <Typography component="legend" sx={{ px: '1rem' }}>
        {t('thesisForm:seminarSupervisor')}
      </Typography>

      <FormControl fullWidth>
        <Autocomplete<Partial<User>>
          id="seminarSupervisions-0-user"
          noOptionsText={t('userSearchNoOptions')}
          data-testid="seminar-supervisor-select-input"
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''}`
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('thesisForm:seminarSupervisor')}
              required
              helperText={errorMessage ? t(errorMessage) : undefined}
              error={Boolean(fieldError || generalError)}
            />
          )}
          inputValue={userSearch}
          filterOptions={(x) => x}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selection.user ?? null}
          onChange={(_, value) => handleChange(value)}
          onInputChange={(_, value) => {
            setUserSearch(value)
          }}
        />
      </FormControl>
    </Stack>
  )
}

export default SeminarSupervisorSelect
