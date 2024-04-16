import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { ThemeProvider } from '@mui/material/styles'
import { SnackbarProvider } from 'notistack'

import { FULL_URL } from '../config'
import { useTheme } from './theme'
import useLoggedInUser from './hooks/useLoggedInUser'
import Footer from './components/Footer'
import NavBar from './components/NavBar/NavBar'

const App = () => {
  const theme = useTheme()

  const { user, isLoading } = useLoggedInUser()

  if (isLoading) return null
  if (!user?.id) {
    window.location.href = `${FULL_URL}/api/login`
    return null
  }

  return (
    <ThemeProvider theme={theme}>
      <SnackbarProvider preventDuplicate>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <NavBar />
          <Box
            flexGrow={1}
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="100vh"
          >
            <Outlet />
          </Box>
          <Footer />
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default App
