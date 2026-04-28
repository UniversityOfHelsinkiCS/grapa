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
import useDepartments from '../../hooks/useDepartments'
import usePrograms from '../../hooks/usePrograms'
import { TranslationLanguage } from '@backend/types'

import LanguageSelect from './LanguageSelect'
import MobileMenu from './MobileMenu'
import ProfileMenu from './ProfileMenu'
import { PositionedMenu, PositionedMenuLinkItem } from './PositionedMenu'

export const navStyles = {
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

const sortProgramsForMenu = (
  programs: Array<{
    id: string
    name: Record<TranslationLanguage, string>
    isManaged: boolean
  }>,
  language: TranslationLanguage
) =>
  [...programs].sort((leftProgram, rightProgram) => {
    if (leftProgram.isManaged !== rightProgram.isManaged) {
      return leftProgram.isManaged ? -1 : 1
    }

    return leftProgram.name[language].localeCompare(rightProgram.name[language])
  })

const sortDepartmentsForMenu = (
  departments: Array<{
    id: string
    name: Record<TranslationLanguage, string>
  }>,
  language: TranslationLanguage
) =>
  [...departments].sort((leftDepartment, rightDepartment) =>
    leftDepartment.name[language].localeCompare(rightDepartment.name[language])
  )

const ProgramMenu = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { programs } = usePrograms({ includeNotManaged: false })
  const sortedPrograms = programs
    ? sortProgramsForMenu(programs, language)
    : undefined

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <PositionedMenu
      label={t('navbar:program')}
      open={open}
      anchorEl={anchorEl}
      handleClick={handleClick}
      handleClose={handleClose}
    >
      {sortedPrograms?.map((program) => (
        <PositionedMenuLinkItem
          key={program.id}
          to={`/programs/${program.id}`}
          onClick={handleClose}
        >
          {program.name[language]}
        </PositionedMenuLinkItem>
      ))}
    </PositionedMenu>
  )
}

const DepartmentMenu = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { departments } = useDepartments({ includeNotManaged: false })
  const sortedDepartments = departments
    ? sortDepartmentsForMenu(departments, language)
    : undefined

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  return (
    <PositionedMenu
      label={t('navbar:department')}
      open={open}
      anchorEl={anchorEl}
      handleClick={handleClick}
      handleClose={handleClose}
    >
      {sortedDepartments?.map((department) => (
        <PositionedMenuLinkItem
          key={department.id}
          to={`/departments/${department.id}`}
          onClick={handleClose}
        >
          {department.name[language]}
        </PositionedMenuLinkItem>
      ))}
    </PositionedMenu>
  )
}

const EthesisLink = () => {
  return (
    <Button component={NavLink} to="/ethesis" sx={navStyles.link}>
      Ethesis
    </Button>
  )
}

const NavBar = () => {
  const { t, i18n } = useTranslation()
  const { user, isLoading } = useLoggedInUser()
  const { departments } = useDepartments({ includeNotManaged: false })
  const { programs } = usePrograms({ includeNotManaged: false })
  const { language } = i18n as { language: TranslationLanguage }
  const sortedPrograms = programs
    ? sortProgramsForMenu(programs, language)
    : undefined
  const sortedDepartments = departments
    ? sortDepartmentsForMenu(departments, language)
    : undefined

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
              {Boolean(user.isAdmin || user.managedProgramIds?.length) && (
                <ProgramMenu />
              )}
              {Boolean(user.isAdmin || user.managedDepartmentIds?.length) && (
                <DepartmentMenu />
              )}
              {user?.ethesisAdmin && <EthesisLink />}
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
        {sortedPrograms?.map((program) => (
          <ListItem disablePadding key={program.id}>
            <ListItemButton
              component={NavLink}
              to={`/programs/${program.id}`}
              sx={{ justifyContent: 'space-between', px: 4 }}
            >
              <ListItemText primary={program.name[language]} />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider />
        {sortedDepartments?.map((department) => (
          <ListItem disablePadding key={department.id}>
            <ListItemButton
              component={NavLink}
              to={`/departments/${department.id}`}
              sx={{ justifyContent: 'space-between', px: 4 }}
            >
              <ListItemText primary={department.name[language]} />
            </ListItemButton>
          </ListItem>
        ))}
        <Divider />
        {user?.ethesisAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/ethesis">
              <ListItemText primary="Ethesis" />
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
