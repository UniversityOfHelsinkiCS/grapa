import { User } from '@backend/types'
import {
  Autocomplete,
  Stack,
  TextField,
  FormControl,
  IconButton,
  ButtonProps,
  TextFieldProps,
  Box,
  Checkbox,
  Tooltip,
  FormControlProps,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import DeleteIcon from '@mui/icons-material/Delete'
import Star from '@mui/icons-material/Star'
import StarOutline from '@mui/icons-material/StarOutline'
import useUsers from '../../../hooks/useUsers'
import { useDebounce } from '../../../hooks/useDebounce'
import DeleteConfirmation from '../../Common/DeleteConfirmation'
import PercentageInput from '../PercentageInput'

interface SingleSupervisorSelectProps {
  index: number
  selection: {
    user: Partial<User> | null
    percentage: number
    isPrimarySupervisor: boolean
  }
  handleSupervisorChange: (value: Partial<User> | null) => void
  handleRemoveSupervisor: () => void
  handlePercentageChange: (percentage: number) => void
  handlePrimarySupervisorChange: () => void
  inputProps: TextFieldProps
  iconButtonProps: ButtonProps
  percentageInputProps: TextFieldProps
  primarySupervisorProps: FormControlProps
}
const SingleSupervisorSelect: React.FC<SingleSupervisorSelectProps> = ({
  index,
  selection,
  handleSupervisorChange,
  handleRemoveSupervisor,
  handlePercentageChange,
  handlePrimarySupervisorChange,
  inputProps,
  iconButtonProps,
  percentageInputProps,
  primarySupervisorProps,
}) => {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  return (
    <Stack spacing={1} direction="row">
      <FormControl fullWidth>
        <Autocomplete<Partial<User>>
          id={`supervisions-${index}-user`}
          noOptionsText={t('userSearchNoOptions')}
          data-testid={`supervisor-select-input-${index + 1}`}
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''}`
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('supervisor', { index: index + 1 })}
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

      <PercentageInput
        label={t('thesisForm:selectSupervisorPercentage')}
        value={selection.percentage}
        onChange={handlePercentageChange}
        percentageInputProps={percentageInputProps}
      />

      <Tooltip
        title={
          selection.isPrimarySupervisor
            ? t('thesisForm:primarySupervisor')
            : t('thesisForm:setPrimarySupervisor')
        }
      >
        <FormControl
          {...primarySupervisorProps}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Checkbox
            icon={
              <StarOutline
                color={primarySupervisorProps.error ? 'error' : 'primary'}
              />
            }
            checkedIcon={<Star />}
            checked={selection.isPrimarySupervisor}
            onChange={handlePrimarySupervisorChange}
            inputProps={{
              'aria-invalid':
                primarySupervisorProps.error && !selection.isPrimarySupervisor,
            }}
          />
        </FormControl>
      </Tooltip>

      <Tooltip
        title={
          selection.isPrimarySupervisor
            ? t('thesisForm:primarySupervisorDeleteError')
            : `${t('removeButton')} ${t('supervisor', { index: index + 1 })}`
        }
      >
        <Box component="span" sx={{ alignContent: 'center' }}>
          <IconButton
            data-testid="remove-supervisor-button"
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            color="error"
            size="small"
            {...iconButtonProps}
          >
            <DeleteIcon />
          </IconButton>
        </Box>
      </Tooltip>

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
