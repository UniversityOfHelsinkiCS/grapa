import { useTranslation } from 'react-i18next'
import {
  ListItemIcon,
  ListItemText,
  ListSubheader,
  MenuItem,
} from '@mui/material'
import ExitToAppIcon from '@mui/icons-material/ExitToApp'

import apiClient from '../../util/apiClient'

const Logout = () => {
  const { t } = useTranslation()

  const handleLogout = async () => {
    const response = await apiClient.post('/logout')
    const { url } = response.data

    window.location.href = url
  }

  return (
    <>
      <ListSubheader disableSticky>{t('navbar:logoutSubHeader')}</ListSubheader>
      <MenuItem onClick={handleLogout} sx={{ px: 4 }}>
        <ListItemIcon>
          <ExitToAppIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText primary={t('navbar:logout')} />
      </MenuItem>
    </>
  )
}

export default Logout
