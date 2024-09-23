import React from 'react'
import {
  Autocomplete,
  Box,
  ButtonProps,
  FormControl,
  IconButton,
  Stack,
  TextField,
  TextFieldProps,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { User, GraderData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '../../../hooks/useDebounce'
import useUsers from '../../../hooks/useUsers'
import DeleteConfirmation from '../../Common/DeleteConfirmation'

interface SingleGraderSelectProps {
  index: number
  selection: GraderData
  handleGraderChange: (value: Partial<User> | null) => void
  handleRemoveGrader: () => void
  inputProps: TextFieldProps
  iconButtonProps: ButtonProps
}

const SingleGraderSelect: React.FC<SingleGraderSelectProps> = ({
  index,
  selection,
  handleGraderChange,
  handleRemoveGrader,
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
        <Autocomplete<Partial<User>>
          id={`graders-${index}-user`}
          noOptionsText={
            userSearch.length < 5
              ? t('userSearchNoOptions')
              : t('userSearchExtPersonHint')
          }
          data-testid={`grader-select-input-${index + 1}`}
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''}`
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
      {!selection.isPrimaryGrader && (
        <>
          <IconButton
            data-testid="remove-grader-button"
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
            onDelete={handleRemoveGrader}
            title={t('thesisForm:removeGraderConfirmationTitle')}
          >
            <Box>
              {selection.user
                ? t('thesisForm:removeGraderConfirmationContent', {
                    name: `${selection.user.firstName} ${selection.user.lastName}`,
                  })
                : t('thesisForm:removeGraderConfirmationNoName', {
                    index: index + 1,
                  })}
            </Box>
          </DeleteConfirmation>
        </>
      )}
    </Stack>
  )
}

export default SingleGraderSelect
