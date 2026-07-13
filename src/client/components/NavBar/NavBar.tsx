import React, { useState, Fragment, useMemo } from 'react'
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
import {
  TranslationLanguage,
  ProgramData,
  DepartmentData,
} from '@backend/types'

import LanguageSelect from './LanguageSelect'
import MobileMenu from './MobileMenu'
import ProfileMenu from './ProfileMenu'
import {
  PositionedMenu,
  PositionedMenuLinkItem,
  PositionedMenuTextItem,
} from './PositionedMenu'

export const navStyles = {
  appbar: {
    zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
    backgroundColor: 'rgb(18, 76, 140)',
    borderRadius: 0,
    py: '0.25rem',
    boxShadow: 0,
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
  programs: ProgramData[],
  language: TranslationLanguage
) =>
  [...programs].sort((leftProgram, rightProgram) => {
    if (leftProgram.isManaged !== rightProgram.isManaged) {
      return leftProgram.isManaged ? -1 : 1
    }

    return leftProgram.name[language].localeCompare(rightProgram.name[language])
  })

const sortDepartmentsForMenu = (
  departments: DepartmentData[],
  language: TranslationLanguage
) =>
  [...departments].sort((leftDepartment, rightDepartment) =>
    leftDepartment.name[language].localeCompare(rightDepartment.name[language])
  )

const ProgramMenu = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user } = useLoggedInUser()
  const { data: rawPrograms } = usePrograms({
    includeNotManaged: false,
    includeManagedStudyTracks: true,
  })

  const managedPrograms = useMemo(() => {
    if (!rawPrograms) return undefined
    if (user?.isAdmin) return rawPrograms
    return rawPrograms.filter(
      (p) =>
        user?.managedProgramIds?.includes(p.id) ||
        p.studyTracks?.some((st: any) =>
          user?.managedStudyTrackIds?.includes(st.id)
        )
    )
  }, [rawPrograms, user])

  const sortedPrograms = managedPrograms
    ? sortProgramsForMenu(managedPrograms, language)
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
      {sortedPrograms?.map((program) => {
        const isProgramManaged = Boolean(
          user?.isAdmin || user?.managedProgramIds?.includes(program.id)
        )
        return (
          <Fragment key={program.id}>
            {isProgramManaged ? (
              <PositionedMenuLinkItem
                to={`/programs/${program.id}`}
                onClick={handleClose}
              >
                {program.name[language]}
              </PositionedMenuLinkItem>
            ) : (
              <PositionedMenuTextItem>
                {program.name[language]}
              </PositionedMenuTextItem>
            )}
            {!program.options?.disableStudyTracks &&
              program.studyTracks
                ?.filter(
                  (st: any) =>
                    user?.isAdmin ||
                    user?.managedStudyTrackIds?.includes(st.id) ||
                    isProgramManaged
                )
                .map((st: any) => (
                  <PositionedMenuLinkItem
                    key={st.id}
                    to={`/study-tracks/${st.id}`}
                    onClick={handleClose}
                    indented
                  >
                    {st.name[language]}
                  </PositionedMenuLinkItem>
                ))}
          </Fragment>
        )
      })}
    </PositionedMenu>
  )
}

const DepartmentMenu = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user } = useLoggedInUser()
  const { departments } = useDepartments({ includeNotManaged: false })

  const managedDepartments = useMemo(() => {
    if (!departments) return undefined
    if (user?.isAdmin) return departments
    return departments.filter((d) => user?.managedDepartmentIds?.includes(d.id))
  }, [departments, user])

  const sortedDepartments = managedDepartments
    ? sortDepartmentsForMenu(managedDepartments, language)
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

const AdminMenu = () => {
  const { t } = useTranslation()

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
      label={
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <AdminPanelSettingsOutlined sx={navStyles.icon} />
          {t('common:admin', 'Admin')}
        </Box>
      }
      open={open}
      anchorEl={anchorEl}
      handleClick={handleClick}
      handleClose={handleClose}
      sx={navStyles.navlink}
    >
      <PositionedMenuLinkItem to="/manage-programs" onClick={handleClose}>
        {t('navbar:managePrograms', 'Manage programs')}
      </PositionedMenuLinkItem>
      <PositionedMenuLinkItem to="/manage-departments" onClick={handleClose}>
        {t('navbar:manageDepartments', 'Manage departments')}
      </PositionedMenuLinkItem>
      <PositionedMenuLinkItem to="/all-theses" onClick={handleClose}>
        {t('navbar:allTheses', 'All theses')}
      </PositionedMenuLinkItem>
      <PositionedMenuLinkItem to="/admin-other" onClick={handleClose}>
        {t('navbar:adminOther', 'Admin Tools')}
      </PositionedMenuLinkItem>
      <PositionedMenuLinkItem to="/login-as" onClick={handleClose}>
        {t('navbar:loginAs', 'Login as')}
      </PositionedMenuLinkItem>
    </PositionedMenu>
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
  const { data: rawPrograms } = usePrograms({
    includeNotManaged: false,
    includeManagedStudyTracks: true,
    enabled: hasStaffAccess,
  })
  const { language } = i18n as { language: TranslationLanguage }

  const managedPrograms = useMemo(() => {
    if (!rawPrograms) return undefined
    if (user?.isAdmin) return rawPrograms
    return rawPrograms.filter(
      (p) =>
        user?.managedProgramIds?.includes(p.id) ||
        p.studyTracks?.some((st: any) =>
          user?.managedStudyTrackIds?.includes(st.id)
        )
    )
  }, [rawPrograms, user])

  const managedDepartments = useMemo(() => {
    if (!departments) return undefined
    if (user?.isAdmin) return departments
    return departments.filter((d) => user?.managedDepartmentIds?.includes(d.id))
  }, [departments, user])

  const sortedPrograms = managedPrograms
    ? sortProgramsForMenu(managedPrograms, language)
    : undefined
  const sortedDepartments = managedDepartments
    ? sortDepartmentsForMenu(managedDepartments, language)
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
              sx={{ flexGrow: 1, display: { xs: 'none', sm: 'flex' }, gap: 1 }}
            >
              {hasStaffAccess && <SupervisedThesesLink />}
              {Boolean(
                user.isAdmin ||
                user.managedProgramIds?.length ||
                user.managedStudyTrackIds?.length
              ) && <ProgramMenu />}
              {Boolean(user.isAdmin || user.managedDepartmentIds?.length) && (
                <DepartmentMenu />
              )}
              {user?.hasSeminarSupervisions && <SeminarLink />}
              {user?.ethesisAdmin && <EthesisLink />}
              {user?.hasStudyRight && <MyThesesLink />}
            </Box>

            <Box
              sx={{
                display: { xs: 'none', sm: 'flex' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              {user?.isAdmin && <AdminMenu />}
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
            <ListItemButton component={NavLink} to="/login-as">
              <ListItemIcon>
                <AdminPanelSettingsOutlined />
              </ListItemIcon>
              <ListItemText primary={t('navbar:loginAs')} />
            </ListItemButton>
          </ListItem>
        )}
        {user?.isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/all-theses">
              <ListItemIcon>
                <AdminPanelSettingsOutlined />
              </ListItemIcon>
              <ListItemText primary={t('navbar:allTheses', 'All theses')} />
            </ListItemButton>
          </ListItem>
        )}
        {user?.isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/manage-programs">
              <ListItemIcon>
                <AdminPanelSettingsOutlined />
              </ListItemIcon>
              <ListItemText
                primary={t('navbar:managePrograms', 'Manage programs')}
              />
            </ListItemButton>
          </ListItem>
        )}
        {user?.isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/manage-departments">
              <ListItemIcon>
                <AdminPanelSettingsOutlined />
              </ListItemIcon>
              <ListItemText
                primary={t('navbar:manageDepartments', 'Manage departments')}
              />
            </ListItemButton>
          </ListItem>
        )}
        {user?.isAdmin && (
          <ListItem disablePadding>
            <ListItemButton component={NavLink} to="/admin-other">
              <ListItemIcon>
                <AdminPanelSettingsOutlined />
              </ListItemIcon>
              <ListItemText primary={t('navbar:adminOther', 'Admin Panel')} />
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
