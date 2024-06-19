/* eslint-disable @typescript-eslint/no-unused-vars */
import { AuthorData } from '@backend/types'
import {
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  Box,
  ButtonProps,
  TextFieldProps,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import React from 'react'
import { useTranslation } from 'react-i18next'
import DeleteConfirmation from '../Common/DeleteConfirmation'

interface ExternalPersonInputProps {
  index: number
  inputGroup: 'supervisions' | 'graders'
  selection: { user: AuthorData | null; percentage: number }
  handleSupervisorChange: (value: AuthorData | null) => void
  handleRemoveSupervisor: () => void
  handlePercentageChange: (percentage: number) => void
  inputProps: TextFieldProps
  iconButtonProps: ButtonProps
}

const ExternalPersonInput = ({
  index,
  inputGroup,
  selection,
  handleSupervisorChange,
  handleRemoveSupervisor,
  handlePercentageChange,
  inputProps,
  iconButtonProps,
}: ExternalPersonInputProps) => {
  const { t } = useTranslation()

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const handleInputChange = (key: string, value: string) => {
    handleSupervisorChange({
      ...selection.user,
      [key]: value,
    })
  }

  return (
    <Stack spacing={1} direction="column">
      <Stack spacing={1} direction="row">
        <TextField
          autoFocus
          required
          margin="dense"
          id={`${inputGroup}-${index}-user-firstName`}
          name="firstName"
          label={t('firstName')}
          value={selection.user?.firstName ?? ''}
          onChange={(event) =>
            handleInputChange('firstName', event.target.value)
          }
          fullWidth
          variant="outlined"
          {...inputProps}
        />

        <TextField
          required
          margin="dense"
          id={`${inputGroup}-${index}-user-lastName`}
          name="lastName"
          label={t('lastName')}
          value={selection.user?.lastName ?? ''}
          onChange={(event) =>
            handleInputChange('lastName', event.target.value)
          }
          fullWidth
          variant="outlined"
          {...inputProps}
        />
      </Stack>
      <Stack spacing={1} direction="row">
        <TextField
          required
          margin="dense"
          id={`${inputGroup}-${index}-user-email`}
          name="email"
          label={t('email')}
          value={selection.user?.email ?? ''}
          onChange={(event) => handleInputChange('email', event.target.value)}
          fullWidth
          variant="outlined"
          {...inputProps}
        />

        {/* <TextField
          required
          margin="dense"
          id={`${inputGroup}-${index}-user-affiliate`}
          name="affiliate"
          label={t('affiliate')}
          value={selection.user.affiliate}
          onChange={(event) => handleInputChange('affiliate', event.target.value)}
          fullWidth
          variant="outlined"
          {...inputProps}
        /> */}

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
      </Stack>

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

export default ExternalPersonInput
