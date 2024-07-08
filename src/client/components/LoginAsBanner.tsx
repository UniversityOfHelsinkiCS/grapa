import { User } from '@backend/types'
import { Button, Paper, Typography } from '@mui/material'

import React from 'react'

const LoggedInAsBanner = () => {
  const [user, setUser] = React.useState<User | null>(null)

  React.useLayoutEffect(() => {
    const loggedInAs = localStorage.getItem('grapa-admin-logged-in-as')
    if (!loggedInAs) return

    setUser(JSON.parse(loggedInAs) as User)
  }, [])

  const handleClick = () => {
    localStorage.removeItem('grapa-admin-logged-in-as')
    window.location.reload()
  }

  if (!user) return null

  return (
    <Paper
      sx={{
        position: 'sticky',
        top: 0,
        display: 'flex',
        alignItems: 'center',
        p: '1rem',
        zIndex: 10,
        backgroundColor: 'warning.main',
      }}
    >
      <Typography fontWeight="bold">
        Logged in as {user.firstName} {user.lastName} {user.email}
      </Typography>
      <Button
        variant="outlined"
        onClick={handleClick}
        sx={{
          ml: 'auto',
          fontWeight: 'bold',
          backgroundColor: 'primary.light',
          color: 'black',
        }}
      >
        Return to yourself
      </Button>
    </Paper>
  )
}

export default LoggedInAsBanner
