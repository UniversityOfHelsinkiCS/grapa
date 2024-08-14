import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { NavLink } from 'react-router-dom'
import { AdminPanelSettingsOutlined } from '@mui/icons-material'
import MenuIcon from '@mui/icons-material/Menu'
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Theme,
  Toolbar,
  Typography,
} from '@mui/material'

import hyLogo from '../../assets/hy_logo.svg'
import useLoggedInUser from '../../hooks/useLoggedInUser'

import LanguageSelect from './LanguageSelect'
import MobileMenu from './MobileMenu'
import ProfileMenu from './ProfileMenu'

const navStyles = {
  appbar: {
    zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
    backgroundColor: 'rgba(255, 255, 255, 0)',
    borderRadius: 0,
    borderBottom: '1px solid black',
    py: '1rem',
    height: '100px',
  },
  toolbar: {
    display: 'flex',
    width: '100%',
    '@media print': {
      display: 'none',
    },
    justifyContent: 'space-between',
    padding: '0.2rem 0 0.2rem 0',
  },
  appName: {
    textTransform: 'uppercase',
    color: 'black',
    fontWeight: 700,
    fontSize: 24,
    userSelect: 'none',
    textDecoration: 'none',
  },
  navBox: {
    display: 'inline-flex',
    alignItems: 'center',
    color: 'inherit',
    textDecoration: 'none',
    marginRight: 1,
    fontWeight: (theme: Theme) => theme.typography.fontWeightMedium,
    padding: '5px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    transition: 'background-color 0.1s',
    borderRadius: 3,
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
  },
  icon: { mr: 1 },
  link: {
    color: 'black',
    textDecoration: 'none',
    fontWeight: (theme: Theme) => theme.typography.fontWeightMedium,
    '&.active': {
      color: 'primary.main',
    },
  },
}

const NavBar = () => {
  const { t } = useTranslation()
  const { user, isLoading } = useLoggedInUser()

  const [mobileOpen, setMobileOpen] = useState(false)

  const handleMobileToggle = () => {
    setMobileOpen((prevState) => !prevState)
  }

  if (isLoading) return null

  return (
    <>
      <AppBar elevation={0} position="relative" sx={navStyles.appbar}>
        <Container maxWidth={false}>
          <Toolbar sx={navStyles.toolbar} disableGutters>
            <Box sx={navStyles.navBox}>
              <img
                src={hyLogo}
                alt="University of Helsinki logo"
                loading="lazy"
                width="40 px"
              />
              <Box ml="2rem">
                <Typography component="a" href="/" sx={navStyles.appName}>
                  {t('appName')}
                </Typography>
              </Box>
            </Box>
            <Box
              component="nav"
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}
            >
              {(user.isAdmin || user.managedProgramIds?.length) && (
                <Button
                  component={NavLink}
                  to="/program-managements"
                  sx={navStyles.link}
                >
                  {t('navbar:programManager')}
                </Button>
              )}
            </Box>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
              {user?.isAdmin && (
                <Button component={NavLink} to="/admin" sx={navStyles.link}>
                  <AdminPanelSettingsOutlined sx={navStyles.icon} />{' '}
                  {t('admin')}
                </Button>
              )}
              <ProfileMenu />
            </Box>
            <IconButton
              aria-label={t('navbar:openMobileMenu')}
              edge="start"
              onClick={handleMobileToggle}
              sx={{ display: { xs: 'block', sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>
      <MobileMenu isOpen={mobileOpen} handleClose={handleMobileToggle}>
        {user?.isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/admin">
              <ListItemIcon>
                <AdminPanelSettingsOutlined />
              </ListItemIcon>
              <ListItemText primary={t('navbar:admin')} />
            </ListItemButton>
          </ListItem>
        )}
        {(user.isAdmin || user.managedProgramIds?.length) && (
          <ListItem disablePadding>
            <ListItemButton
              component={NavLink}
              to="/program-managements"
              sx={{ justifyContent: 'space-between', px: 4 }}
            >
              <ListItemText primary={t('navbar:programManager')} />
            </ListItemButton>
          </ListItem>
        )}
        <Divider />
        <LanguageSelect />
      </MobileMenu>
    </>
  )
}

export default NavBar
