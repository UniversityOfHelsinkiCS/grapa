import { AuthorData } from '@backend/types'
import {
  Autocomplete,
  Stack,
  TextField,
  Button,
  FormControl,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import useUsers from '../../hooks/useUsers'
import { useDebounce } from '../../hooks/useDebounce'

interface SingleSupervisorSelectProps {
  handleSupervisorChange: (value: AuthorData | null) => void
  selection: { user: AuthorData | null; percentage: number }
  handleRemoveSupervisor: () => void
  handlePercentageChange: (percentage: number) => void
}
const SingleSupervisorSelect: React.FC<SingleSupervisorSelectProps> = ({
  handleSupervisorChange,
  selection,
  handleRemoveSupervisor,
  handlePercentageChange,
}) => {
  const { t } = useTranslation()
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers(debouncedSearch)

  return (
    <Stack spacing={1} direction="row">
      <FormControl fullWidth>
        <Autocomplete<AuthorData>
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''}`
          }
          renderInput={(params) => (
            <TextField {...params} label={t('author')} required />
          )}
          inputValue={userSearch}
          value={selection.user}
          onChange={(_, value) => handleSupervisorChange(value)}
          onInputChange={(_, value) => {
            setUserSearch(value)
          }}
        />
      </FormControl>
      <TextField
        required
        type="number"
        sx={{ width: 125 }}
        inputProps={{ min: 1, max: 100 }}
        label={t('thesisForm:selectSupervisorPercentage')}
        value={selection.percentage}
        onChange={(event) =>
          handlePercentageChange(parseInt(event.target.value, 10))
        }
      />
      <Button onClick={handleRemoveSupervisor}>{t('removeButton')}</Button>
    </Stack>
  )
}

export default SingleSupervisorSelect
