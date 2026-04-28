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

const SeminarSupervisorSelect: React.FC<{
  errors: ZodIssue[]
  setErrors: (errors: ZodIssue[]) => void
  seminarSupervisorSelections: SeminarSupervisionData[]
  setSeminarSupervisorSelections: (
    seminarSupervisions: SeminarSupervisionData[]
  ) => void
}> = ({
  errors,
  setErrors,
  seminarSupervisorSelections,
  setSeminarSupervisorSelections,
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

  const generalError = errors.find((error) =>
    error.path.join('-').endsWith('general-seminar-supervisor-error')
  )
  const fieldError = errors.find(
    (error) => error.path.join('-') === 'seminarSupervisions-0-user'
  )
  const errorMessage = fieldError?.message ?? generalError?.message

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
