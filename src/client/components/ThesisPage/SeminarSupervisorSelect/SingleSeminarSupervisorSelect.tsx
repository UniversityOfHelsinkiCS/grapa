import { EmployeeUser as User } from '@backend/validators/userResponse'
import {
  Autocomplete,
  Stack,
  TextField,
  FormControl,
  IconButton,
  ButtonProps,
  TextFieldProps,
  Box,
  Tooltip,
} from '@mui/material'
import React from 'react'
import { useTranslation } from 'react-i18next'
import DeleteIcon from '@mui/icons-material/Delete'
import useUsers from '../../../hooks/useUsers'
import { useDebounce } from '../../../hooks/useDebounce'
import Popup from '../../Common/Popup'
import { SeminarSupervisionData } from '@backend/validators/thesisResponse'

interface SingleSeminarSupervisorSelectProps {
  index: number
  selection: SeminarSupervisionData
  handleSeminarSupervisorChange: (value: Partial<User> | null) => void
  handleRemoveSeminarSupervisor: () => void
  inputProps: TextFieldProps
  iconButtonProps: ButtonProps
}

const SingleSeminarSupervisorSelect = ({
  index,
  selection,
  handleSeminarSupervisorChange,
  handleRemoveSeminarSupervisor,
  inputProps,
  iconButtonProps,
}: SingleSeminarSupervisorSelectProps) => {
  const { t } = useTranslation()
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  return (
    <Stack spacing={1} direction="row">
      <FormControl fullWidth>
        <Autocomplete<Partial<User>>
          id={`seminarSupervisions-${index}-user`}
          noOptionsText={t('userSearchNoOptions')}
          data-testid={`seminar-supervisor-select-input-${index + 1}`}
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''}`
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('thesisForm:seminarSupervisor')}
              {...inputProps}
            />
          )}
          filterOptions={(x) => x}
          inputValue={userSearch}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={selection.user}
          onChange={(_, value) => handleSeminarSupervisorChange(value)}
          onInputChange={(_, value) => {
            setUserSearch(value)
          }}
        />
      </FormControl>

      <Tooltip
        title={`${t('removeButton')} ${t('thesisForm:seminarSupervisor')}`}
      >
        <Box component="span" sx={{ alignContent: 'center' }}>
          <IconButton
            data-testid="remove-seminar-supervisor-button"
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

      <Popup
        open={deleteDialogOpen}
        testId="delete-confirm"
        onClose={() => setDeleteDialogOpen(false)}
        onSubmit={() => {
          setDeleteDialogOpen(false)
          handleRemoveSeminarSupervisor()
        }}
        title={t('thesisForm:removeSeminarSupervisorConfirmationTitle')}
        submitText={t('common:deleteButton')}
        submitButtonProps={{ 'data-testid': 'delete-confirm-button' } as any}
        submitColor="error"
        cancelText={t('common:cancelButton')}
      >
        <Box>
          {selection.user
            ? t('thesisForm:removeSeminarSupervisorConfirmationContent', {
                name: `${selection.user.firstName} ${selection.user.lastName}`,
              })
            : t('thesisForm:removeSeminarSupervisorConfirmationNoName', {
                index: index + 1,
              })}
        </Box>
      </Popup>
    </Stack>
  )
}

export default SingleSeminarSupervisorSelect
