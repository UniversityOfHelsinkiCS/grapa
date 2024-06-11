import React from 'react'
import {
  Autocomplete,
  FormControl,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { AuthorData } from '@backend/types'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '../../hooks/useDebounce'
import useUsers from '../../hooks/useUsers'

interface SingleGraderSelectProps {
  index: number
  required: boolean
  handleGraderChange: (value: AuthorData | null) => void
  selection: AuthorData
}

const SingleGraderSelect: React.FC<SingleGraderSelectProps> = ({
  handleGraderChange,
  selection,
  index,
  required = true,
}) => {
  const { t } = useTranslation()
  const [userSearch, setUserSearch] = React.useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers(debouncedSearch)

  return (
    <FormControl fullWidth>
      <Autocomplete<AuthorData>
        disablePortal
        options={users ?? []}
        getOptionLabel={(user) =>
          `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''} ${user.username ? `(${user.username})` : ''}`
        }
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('grader', { index })}
            required={required}
          />
        )}
        inputValue={userSearch}
        filterOptions={(x) => x}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        value={selection ?? null}
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

const GraderSelect: React.FC<{
  graderSelections: AuthorData[]
  setGraderSelections: (newAuthors: AuthorData[]) => void
}> = ({ graderSelections, setGraderSelections }) => {
  const { t } = useTranslation()

  const handleSupervisorChange = (index: number, grader: AuthorData) => {
    const updatedSelections = [...graderSelections]
    updatedSelections[index] = grader
    setGraderSelections(updatedSelections)
  }

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
        {t('thesisForm:graders')}
      </Typography>

      {graderSelections.map((selection, index) => (
        <SingleGraderSelect
          key={selection?.id ?? index}
          index={index + 1}
          required={index === 0}
          selection={selection}
          handleGraderChange={(grader) => handleSupervisorChange(index, grader)}
        />
      ))}
    </Stack>
  )
}

export default GraderSelect
