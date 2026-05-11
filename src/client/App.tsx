import { Outlet } from 'react-router-dom'
import { Box } from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { fiFI } from '@mui/x-date-pickers/locales'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { SnackbarProvider } from 'notistack'

import { FULL_URL } from '../config'
import { useTheme } from './theme'
import useLoggedInUser from './hooks/useLoggedInUser'
import Footer from './components/Footer'
import NavBar from './components/NavBar/NavBar'
import LoggedInAsBanner from './components/LoginAsBanner'
import DepartmentSelector from './components/DepartmentSelector'

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
      <LocalizationProvider dateAdapter={AdapterDayjs}>
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
            <Box component="main" style={{ flexGrow: '1', display: 'flex' }}>
              {!user?.departmentId ? <DepartmentSelector /> : <Outlet />}
            </Box>
            <Footer />
          </Box>
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  )
}

export default App
