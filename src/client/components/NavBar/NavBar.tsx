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

import hyLogo from '../../assets/hy_logo2.svg'
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
    backgroundColor: 'rgb(18, 76, 140)',
    borderRadius: 0,
    py: '0.25rem',
    boxShadow: 2,
  },
  toolbar: {
    display: 'flex',
    width: '100%',
    '@media print': {
      display: 'none',
    },
    justifyContent: 'space-between',
    padding: '0.2rem 0 0.2rem 0',
    color: 'white',
  },
  appName: {
    textTransform: 'uppercase',
    color: 'white',
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
    borderRadius: '0.5rem',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
  },
  icon: { mr: 1 },
  link: {
    textDecoration: 'none',
    fontWeight: (theme: Theme) => theme.typography.fontWeightMedium,
    '&.active': {
      color: 'primary.main',
      textDecoration: 'underline',
      fontWeight: 'bold',
    },
  },
  navlink: {
    color: 'white',
    borderRadius: '0.5rem',
    fontWeight: 700,
    '&.active': {
      backgroundColor: 'rgba(255, 255, 255, 0.22)',
    },
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
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
      sx={navStyles.navlink}
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
      sx={navStyles.navlink}
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

const SupervisedThesesLink = () => {
  const { t } = useTranslation()
  return (
    <Button component={NavLink} to="/supervised-theses" sx={navStyles.navlink}>
      {t('navbar:supervisedTheses', 'Supervised theses')}
    </Button>
  )
}

const EthesisLink = () => {
  return (
    <Button component={NavLink} to="/ethesis" sx={navStyles.navlink}>
      Ethesis
    </Button>
  )
}

const SeminarLink = () => {
  const { t } = useTranslation()

  return (
    <Button component={NavLink} to="/seminar" sx={navStyles.navlink}>
      {t('navbar:seminar')}
    </Button>
  )
}

const MyThesesLink = () => {
  const { t } = useTranslation()

  return (
    <Button component={NavLink} to="/my-theses" sx={navStyles.navlink}>
      {t('navbar:myTheses', 'My Theses')}
    </Button>
  )
}

const NavBar = () => {
  const { t, i18n } = useTranslation()
  const { user, isLoading, hasStaffAccess } = useLoggedInUser()
  const { departments } = useDepartments({
    includeNotManaged: false,
    enabled: hasStaffAccess,
  })
  const { programs } = usePrograms({
    includeNotManaged: false,
    enabled: hasStaffAccess,
  })
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
                style={{ marginRight: '0.5rem' }}
              />
              <NavLink to="/" style={{ textDecoration: 'none' }}>
                <Typography component="span" sx={navStyles.appName}>
                  {t('appName')}
                </Typography>
              </NavLink>
            </Box>
            <Box
              component="nav"
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' } }}
            >
              {hasStaffAccess && <SupervisedThesesLink />}
              {Boolean(user.isAdmin || user.managedProgramIds?.length) && (
                <ProgramMenu />
              )}
              {Boolean(user.isAdmin || user.managedDepartmentIds?.length) && (
                <DepartmentMenu />
              )}
              {user?.hasSeminarSupervisions && <SeminarLink />}
              {user?.ethesisAdmin && <EthesisLink />}
              {user?.hasStudyRight && <MyThesesLink />}
            </Box>

            <Box sx={{ display: { xs: 'none', sm: 'flex' }, gap: 2 }}>
              {user?.isAdmin && (
                <Button component={NavLink} to="/admin" sx={navStyles.navlink}>
                  <AdminPanelSettingsOutlined sx={navStyles.icon} />{' '}
                  {t('admin')}
                </Button>
              )}
              <ProfileMenu sx={navStyles.navlink} />
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
        {user?.hasSeminarSupervisions && (
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/seminar">
              <ListItemText primary={t('navbar:seminar')} />
            </ListItemButton>
          </ListItem>
        )}
        <ListItem disablePadding>
          <ListItemButton component={NavLink} to="/my-theses">
            <ListItemText primary={t('navbar:myTheses')} />
          </ListItemButton>
        </ListItem>
        <Divider />
        <LanguageSelect />
      </MobileMenu>
    </>
  )
}

export default NavBar
