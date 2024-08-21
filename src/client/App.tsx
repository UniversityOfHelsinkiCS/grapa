import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fiFI } from '@mui/x-date-pickers/locales'
import { SnackbarProvider } from 'notistack'

import { FULL_URL } from '../config'
import { useTheme } from './theme'
import useLoggedInUser from './hooks/useLoggedInUser'
import Footer from './components/Footer'
import NavBar from './components/NavBar/NavBar'
import LoggedInAsBanner from './components/LoginAsBanner'
import DepartmentSelector from './DepartmentSelector'

const App = () => {
  const theme = useTheme()
  const themeWithLocale = createTheme(theme, fiFI)

  const { user, isLoading } = useLoggedInUser()

  if (isLoading) return null
  if (!user?.id) {
    window.location.href = `${FULL_URL}/api/login`
    return null
  }

  return (
    <ThemeProvider theme={themeWithLocale}>
      <SnackbarProvider preventDuplicate>
        <LoggedInAsBanner />
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <NavBar />
          <Box flexGrow={1} display="flex">
            {!user?.departmentId ? <DepartmentSelector /> : <Outlet />}
          </Box>
          <Footer />
        </Box>
      </SnackbarProvider>
    </ThemeProvider>
  )
}

export default App
