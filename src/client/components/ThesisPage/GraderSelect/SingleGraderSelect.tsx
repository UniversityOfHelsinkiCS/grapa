import React from 'react'
import {
  Autocomplete,
  FormControl,
  TextField,
  TextFieldProps,
} from '@mui/material'
import { AuthorData, GraderData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '../../../hooks/useDebounce'
import useUsers from '../../../hooks/useUsers'

interface SingleGraderSelectProps {
  index: number
  handleGraderChange: (value: AuthorData | null) => void
  selection: GraderData
  inputProps: TextFieldProps
}

const SingleGraderSelect: React.FC<SingleGraderSelectProps> = ({
  handleGraderChange,
  selection,
  index,
  inputProps,
}) => {
  const { t } = useTranslation()
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers(debouncedSearch)

  return (
    <FormControl fullWidth>
      <Autocomplete<AuthorData>
        id={`graders-${index}-user`}
        data-testid={`grader-select-input-${index + 1}`}
        disablePortal
        options={users ?? []}
        getOptionLabel={(user) =>
          `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''} ${user.username ? `(${user.username})` : ''}`
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('grader', { index: index + 1 })}
            {...inputProps}
          />
        )}
        inputValue={userSearch}
        filterOptions={(x) => x}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selection.user ?? null}
        onChange={(_, value) => handleGraderChange(value)}
        onInputChange={(event, value) => {
          // Fetch potential authors based on the input value
          // You can use debounce or throttle to limit the number of requests
          // Example: fetchPotentialAuthors(value)
          setUserSearch(value)
        }}
      />
    </FormControl>
  )
}

export default SingleGraderSelect
