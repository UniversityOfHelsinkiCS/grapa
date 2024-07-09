import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Button,
  FormControl,
  TextField,
  Typography,
} from '@mui/material'
import { User } from '@backend/types'

import { useDebounce } from '../hooks/useDebounce'
import useUsers from '../hooks/useUsers'
import { loginAs } from '../util/loginAs'

const LoginAs: React.FC = () => {
  const { t } = useTranslation()

  const [loginAsCandidate, setLoginAsCandidate] = useState<User | null>(null)

  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  const handleLoginAs = () => {
    loginAs(loginAsCandidate)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        marginTop: '30px',
        width: '70%',
      }}
    >
      <Typography variant="h3">Login as another user</Typography>
      <FormControl fullWidth>
        <Autocomplete
          id="login-as-user"
          noOptionsText={t('userSearchNoOptions')}
          data-testid="login-as-user"
          disablePortal
          options={users ?? []}
          getOptionLabel={(user) =>
            `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''} ${user.username ? `(${user.username})` : ''}`
          }
          renderInput={(params) => (
            <TextField
              {...params}
              label={t('loginAsPage:userHeader')}
              required
            />
          )}
          inputValue={userSearch}
          filterOptions={(x) => x}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          value={loginAsCandidate}
          onChange={(_, value) => {
            setLoginAsCandidate(value)
          }}
          onInputChange={(_, value) => {
            setUserSearch(value)
          }}
        />
      </FormControl>
      <Button
        variant="contained"
        data-testid="login-as-button"
        disabled={!loginAsCandidate}
        onClick={handleLoginAs}
      >
        Login As
      </Button>
    </div>
  )
}

export default LoginAs
