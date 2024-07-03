import { useRef, useState, useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  MenuItem,
  Box,
  Container,
  MenuList,
  Button,
  Paper,
  ClickAwayListener,
  Grow,
  Popper,
  Typography,
} from '@mui/material'
import LogoutIcon from '@mui/icons-material/Logout'
import Language from '@mui/icons-material/Language'
import { useTranslation } from 'react-i18next'

import { Link } from 'react-router-dom'
import useLoggedInUser from '../../hooks/useLoggedInUser'

import styles from '../../styles'
import hyLogo from '../../assets/hy_logo.svg'
import apiClient from '../../util/apiClient'

const NavBar = () => {
  const { t, i18n } = useTranslation()
  const { user, isLoading } = useLoggedInUser()
  const [openLanguageSelect, setOpenLanguageSelect] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (user?.language === 'en') i18n.changeLanguage('en')
  }, [user, i18n])

  const { language } = i18n
  const languages = ['fi', 'en']

  const handleLanguageChange = (newLanguage: string) => {
    i18n.changeLanguage(newLanguage)
    setOpenLanguageSelect(false)
  }

  const { navStyles } = styles

  if (isLoading) return null

  return (
    <AppBar elevation={0} position="relative" sx={navStyles.appbar}>
      <Container maxWidth={false}>
        <Toolbar sx={navStyles.toolbar} disableGutters>
          <Box sx={navStyles.navBox}>
            <Link
              to="/"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
              }}
            >
              <img src={hyLogo} alt="University of Helsinki" width="40" />
              <Box ml="2rem">
                <Typography sx={navStyles.appName}>{t('appName')}</Typography>
              </Box>
            </Link>
          </Box>
          <Box sx={{ display: 'flex' }}>
            {user.isAdmin || user.managedProgramIds?.length ? (
              <Button variant="outlined" sx={{ marginRight: '25px' }}>
                <Link
                  to="/program-managements"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  {t('programManagersNavItem')}
                </Link>
              </Button>
            ) : null}
            <Button
              ref={anchorRef}
              id="composition-button"
              data-cy="language-select"
              aria-controls={
                openLanguageSelect ? 'composition-menu' : undefined
              }
              aria-expanded={openLanguageSelect ? 'true' : undefined}
              aria-haspopup="true"
              onClick={() => setOpenLanguageSelect(!openLanguageSelect)}
            >
              <Language sx={navStyles.language} /> {language}
            </Button>
            <Popper
              open={openLanguageSelect}
              anchorEl={anchorRef.current}
              role={undefined}
              placement="bottom-start"
              transition
              disablePortal
            >
              {({ TransitionProps, placement }) => (
                <Grow
                  {...TransitionProps}
                  style={{
                    transformOrigin:
                      placement === 'bottom-start' ? 'left top' : 'left bottom',
                  }}
                >
                  <Paper>
                    <ClickAwayListener
                      onClickAway={() =>
                        setOpenLanguageSelect(!openLanguageSelect)
                      }
                    >
                      <MenuList
                        autoFocusItem={openLanguageSelect}
                        id="composition-menu"
                        aria-labelledby="composition-button"
                      >
                        {languages.map((l) => (
                          <MenuItem
                            key={l}
                            sx={[
                              navStyles.item,
                              language === l && navStyles.activeItem,
                            ]}
                            onClick={() => {
                              handleLanguageChange(l)
                            }}
                          >
                            {l.toUpperCase()}
                          </MenuItem>
                        ))}
                      </MenuList>
                    </ClickAwayListener>
                  </Paper>
                </Grow>
              )}
            </Popper>
            <Button
              onClick={async () => {
                await apiClient.post('/logout')
              }}
            >
              <LogoutIcon />
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  )
}

export default NavBar
