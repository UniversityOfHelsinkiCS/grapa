import { AuthorData } from '@backend/types'
import {
  Autocomplete,
  Stack,
  TextField,
  FormControl,
  IconButton,
  InputAdornment,
  ButtonProps,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import DeleteIcon from '@mui/icons-material/Delete'
import useUsers from '../../../hooks/useUsers'
import { useDebounce } from '../../../hooks/useDebounce'

interface SingleSupervisorSelectProps {
  index: number
  handleSupervisorChange: (value: AuthorData | null) => void
  selection: { user: AuthorData | null; percentage: number }
  handleRemoveSupervisor: () => void
  handlePercentageChange: (percentage: number) => void
  iconButtonProps: ButtonProps
}
const SingleSupervisorSelect: React.FC<SingleSupervisorSelectProps> = ({
  index,
  handleSupervisorChange,
  selection,
  handleRemoveSupervisor,
  handlePercentageChange,
  iconButtonProps,
}) => {
  const { t } = useTranslation()
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers(debouncedSearch)

  return (
    <Stack spacing={1} direction="row">
      <FormControl fullWidth>
        <Autocomplete<AuthorData>
          data-testid={`supervisor-select-input-${index}`}
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''} ${user.username ? `(${user.username})` : ''}`
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('thesisForm:selectSupervisor')}
              required
            />
          )}
          filterOptions={(x) => x}
          inputValue={userSearch}
          isOptionEqualToValue={(option, value) => option.id === value.id}
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
        sx={{ width: '12ch' }}
        InputProps={{
          inputProps: { min: 1, max: 100 },
          endAdornment: <InputAdornment position="end">%</InputAdornment>,
        }}
        label={t('thesisForm:selectSupervisorPercentage')}
        value={selection.percentage}
        onChange={(event) => {
          const newValue = parseInt(event.target.value || '1', 10)

          return handlePercentageChange(parseInt(newValue, 10))
        }}
      />
      <IconButton
        data-testid="remove-supervisor-button"
        type="button"
        onClick={handleRemoveSupervisor}
        color="error"
        size="small"
        aria-label={`${t('removeButton')} ${selection.user?.firstName} ${selection.user?.lastName}`}
        {...iconButtonProps}
      >
        <DeleteIcon />
      </IconButton>
    </Stack>
  )
}

export default SingleSupervisorSelect
