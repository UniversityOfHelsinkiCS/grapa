import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Box,
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
  const { users } = useUsers({ search: debouncedSearch })

  const handleLoginAs = () => {
    loginAs(loginAsCandidate)
  }

  return (
    <>
      <Typography component="h1" variant="h4">
        {t('loginAsPage:title')}
      </Typography>
      <Box
        sx={{
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          mt: '2rem',
          mx: 'auto',
        }}
      >
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
          type="submit"
          variant="contained"
          data-testid="login-as-button"
          disabled={!loginAsCandidate}
          onClick={handleLoginAs}
          fullWidth
          sx={{ borderRadius: '0.5rem' }}
        >
          Login As
        </Button>
      </Box>
    </>
  )
}

export default LoginAs
