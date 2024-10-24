import { useTranslation } from 'react-i18next'
import { Link, Navigate, Outlet, useLocation } from 'react-router-dom'
import { Box, Tab, Tabs } from '@mui/material'

import useLoggedInUser from '../../hooks/useLoggedInUser'

const Admin = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, isLoading } = useLoggedInUser()

  if (isLoading) return null

  if (!user?.isAdmin) return <Navigate to="/" />

  const pathParts = location.pathname.split('/').filter(Boolean)

  const tab = pathParts.length < 2 ? 'admin' : pathParts[1]

  return (
    <Box
      sx={{
        alignSelf: 'flex-start',
        width: '100%',
        bgcolor: 'background.paper',
      }}
    >
      <Tabs
        value={tab}
        variant="scrollable"
        scrollButtons
        allowScrollButtonsMobile
      >
        <Tab
          component={Link}
          to="."
          label={t('admin:indexTab')}
          value="admin"
        />
      </Tabs>
      <Box component="section" sx={{ px: '3rem', py: '2rem' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
export default Admin
