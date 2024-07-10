import { User } from '@backend/types'
import {
  Stack,
  TextField,
  IconButton,
  Box,
  ButtonProps,
  TextFieldProps,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import React from 'react'
import { useTranslation } from 'react-i18next'
import DeleteConfirmation from '../Common/DeleteConfirmation'
import PercentageInput from './PercentageInput'

type ExternalPersonInputErrors = {
  firstName?: string | null
  lastName?: string | null
  email?: string | null
  affiliation?: string | null
}

type SupervisorSelection = {
  user: Partial<User> | null
  percentage: number
}

type GraderSelection = {
  user: Partial<User> | null
  isPrimaryGrader: boolean
  isExternal: boolean
}

interface BaseExternalPersonInputProps {
  index: number
  inputGroup: 'supervisions' | 'graders'
  selection: SupervisorSelection | GraderSelection
  handlePersonChange: (value: Partial<User> | null) => void
  handleRemovePerson: () => void
  inputErrors: ExternalPersonInputErrors
  inputProps: TextFieldProps
  iconButtonProps?: ButtonProps // iconButtonProps can have a default value
}

interface SupervisionsExternalPersonInputProps
  extends BaseExternalPersonInputProps {
  inputGroup: 'supervisions'
  handlePercentageChange: (percentage: number) => void
  percentageInputProps: TextFieldProps
}

interface GradersExternalPersonInputProps extends BaseExternalPersonInputProps {
  inputGroup: 'graders'
  handlePercentageChange?: never
  percentageInputProps?: never
}

type ExternalPersonInputProps =
  | SupervisionsExternalPersonInputProps
  | GradersExternalPersonInputProps

const ExternalPersonInput = ({
  index,
  inputGroup,
  selection,
  handlePersonChange,
  handleRemovePerson,
  handlePercentageChange = () => {},
  inputErrors,
  inputProps,
  iconButtonProps = {},
  percentageInputProps,
}: ExternalPersonInputProps) => {
  const { t } = useTranslation()

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)

  const handleInputChange = (key: string, value: string) => {
    handlePersonChange({
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
          label={t('thesisForm:firstName')}
          value={selection.user?.firstName ?? ''}
          onChange={(event) =>
            handleInputChange('firstName', event.target.value)
          }
          fullWidth
          variant="outlined"
          error={Boolean(inputErrors?.firstName)}
          helperText={inputErrors?.firstName}
          {...inputProps}
        />

        <TextField
          required
          margin="dense"
          id={`${inputGroup}-${index}-user-lastName`}
          name="lastName"
          label={t('thesisForm:lastName')}
          value={selection.user?.lastName ?? ''}
          onChange={(event) =>
            handleInputChange('lastName', event.target.value)
          }
          fullWidth
          variant="outlined"
          error={Boolean(inputErrors?.lastName)}
          helperText={inputErrors?.lastName}
          {...inputProps}
        />
      </Stack>
      <Stack spacing={1} direction="row">
        <TextField
          required
          margin="dense"
          id={`${inputGroup}-${index}-user-email`}
          name="email"
          label={t('thesisForm:email')}
          value={selection.user?.email ?? ''}
          onChange={(event) => handleInputChange('email', event.target.value)}
          sx={{ width: '40%' }}
          variant="outlined"
          error={Boolean(inputErrors?.email)}
          helperText={inputErrors?.email}
          {...inputProps}
        />

        <TextField
          required
          margin="dense"
          id={`${inputGroup}-${index}-user-affiliation`}
          name="affiliation"
          label={t('thesisForm:affiliation')}
          value={selection.user?.affiliation ?? ''}
          onChange={(event) =>
            handleInputChange('affiliation', event.target.value)
          }
          sx={{ width: '40%' }}
          variant="outlined"
          error={Boolean(inputErrors?.affiliation)}
          helperText={inputErrors?.affiliation}
          {...inputProps}
        />

        {inputGroup === 'supervisions' && (
          <PercentageInput
            label={t('thesisForm:selectSupervisorPercentage')}
            value={(selection as SupervisorSelection).percentage}
            onChange={handlePercentageChange}
            percentageInputProps={percentageInputProps}
          />
        )}

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
        onDelete={handleRemovePerson}
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
