import { User } from '@backend/types'
import {
  Autocomplete,
  Stack,
  TextField,
  FormControl,
  IconButton,
  InputAdornment,
  ButtonProps,
  TextFieldProps,
  Box,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import DeleteIcon from '@mui/icons-material/Delete'
import useUsers from '../../../hooks/useUsers'
import { useDebounce } from '../../../hooks/useDebounce'
import DeleteConfirmation from '../../Common/DeleteConfirmation'

interface SingleSupervisorSelectProps {
  index: number
  selection: { user: User | null; percentage: number }
  handleSupervisorChange: (value: User | null) => void
  handleRemoveSupervisor: () => void
  handlePercentageChange: (percentage: number) => void
  inputProps: TextFieldProps
  iconButtonProps: ButtonProps
}
const SingleSupervisorSelect: React.FC<SingleSupervisorSelectProps> = ({
  index,
  selection,
  handleSupervisorChange,
  handleRemoveSupervisor,
  handlePercentageChange,
  inputProps,
  iconButtonProps,
}) => {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  return (
    <Stack spacing={1} direction="row">
      <FormControl fullWidth>
        <Autocomplete<User>
          id={`supervisions-${index}-user`}
          data-testid={`supervisor-select-input-${index + 1}`}
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''} ${user.studentNumber ? `(${user.studentNumber})` : ''}`
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('thesisForm:selectSupervisor')}
              {...inputProps}
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
        onChange={(event) =>
          handlePercentageChange(parseInt(event.target.value, 10))
        }
      />
      <IconButton
        data-testid="remove-supervisor-button"
        type="button"
        onClick={() => setDeleteDialogOpen(true)}
        color="error"
        size="small"
        aria-label={`${t('removeButton')} ${selection.user?.firstName} ${selection.user?.lastName}`}
        {...iconButtonProps}
      >
        <DeleteIcon />
      </IconButton>
      <DeleteConfirmation
        open={deleteDialogOpen}
        setOpen={setDeleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onDelete={handleRemoveSupervisor}
        title={t('thesisForm:removeSupervisorConfirmationTitle')}
      >
        <Box>
          {selection.user
            ? t('thesisForm:removeSupervisorConfirmationContent', {
                name: `${selection.user.firstName} ${selection.user.lastName}`,
              })
            : t('thesisForm:removeSupervisorConfirmationNoName')}
        </Box>
      </DeleteConfirmation>
    </Stack>
  )
}

export default SingleSupervisorSelect
