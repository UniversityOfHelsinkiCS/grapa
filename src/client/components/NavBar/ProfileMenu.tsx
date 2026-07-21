import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LoggedInUser } from '@backend/validators/userResponse'
import { TranslatedName } from '@backend/validators/departmentResponse'
import {
  Box,
  Divider,
  Button,
  IconButton,
  ListItem,
  ListSubheader,
  Menu,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material'

import useLoggedInUser from '../../hooks/useLoggedInUser'
import useDepartments from '../../hooks/useDepartments'

import LanguageSelect from './LanguageSelect'
import FavoritePrograms from './FavoritePrograms'
import Logout from './Logout'
import DepartmentSelector from '../DepartmentSelector'
import { PersonOutlineOutlined, EditOutlined } from '@mui/icons-material'
import Popup from '../Common/Popup'

const UserInformation = () => {
  const { t, i18n } = useTranslation()
  const { user, isLoading: userLoading, hasStaffAccess } = useLoggedInUser()

  const { departments, isLoading: departmentsLoading } = useDepartments({
    includeNotManaged: true,
    enabled: hasStaffAccess,
  })

  const [departmentDialogOpen, setDepartmentDialogOpen] = useState(false)

  if (!user || userLoading || departmentsLoading)
    return <Skeleton variant="text" width={100} />

  const { language } = i18n
  const displayedFields: (keyof LoggedInUser)[] = [
    'username',
    'email',
    'departmentId',
    'affiliation',
  ]

  return (
    <>
      <ListSubheader disableSticky>
        {t('navbar:userInfoSubHeader')}
      </ListSubheader>
      <ListItem sx={{ px: 4, mb: 2 }} disablePadding>
        <dl style={{ margin: 0, width: '100%' }}>
          {displayedFields.map((field) => {
            let fieldValue = user[field]
            if (fieldValue === null) return null

            if (field === 'departmentId') {
              const department = departments?.find(
                (dep) => dep.id === fieldValue
              )
              fieldValue =
                department?.name[language as keyof TranslatedName] || fieldValue

              return (
                <Box
                  key={field}
                  sx={{
                    display: 'flex',
                    my: 1,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <dt>{t(`userInformation:${field}`)}:</dt>
                  <dd
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: 0,
                    }}
                  >
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ textAlign: 'right' }}
                    >
                      {fieldValue as string}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setDepartmentDialogOpen(true)}
                    >
                      <EditOutlined fontSize="small" />
                    </IconButton>
                  </dd>
                </Box>
              )
            }

            return (
              <Box
                key={field}
                sx={{
                  display: 'flex',
                  my: 1,
                  justifyContent: 'space-between',
                }}
              >
                <dt>{t(`userInformation:${field}`)}:</dt>
                <dd style={{ margin: 0 }}>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ textAlign: 'right' }}
                  >
                    {fieldValue as string}
                  </Typography>
                </dd>
              </Box>
            )
          })}
        </dl>
      </ListItem>
      <Popup
        open={departmentDialogOpen}
        onClose={() => setDepartmentDialogOpen(false)}
        maxWidth="md"
        actions={null} // Disable default Popup buttons since it's just a selector
      >
        <DepartmentSelector onSuccess={() => setDepartmentDialogOpen(false)} />
      </Popup>
    </>
  )
}

interface ProfileMenuProps {
  sx?: object
}

const ProfileMenu = ({ sx }: ProfileMenuProps) => {
  const { t } = useTranslation()
  const { user, isLoading, hasStaffAccess } = useLoggedInUser()

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const open = Boolean(anchorEl)

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = () => {
    setAnchorEl(null)
  }

  if (isLoading) return <Skeleton variant="circular" width={40} height={40} />

  return (
    <>
      <Tooltip title={t('navbar:settings')}>
        <Button
          onClick={handleClick}
          sx={sx}
          aria-controls={open ? 'profile-settings' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : false}
        >
          <PersonOutlineOutlined sx={{ mr: 1 }} /> {user?.firstName}{' '}
          {user?.lastName}
        </Button>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="profile-settings"
        open={open}
        onClose={handleClose}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              width: 655,
              overflowY: 'scroll',
              overflowX: 'visible',
              filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
              mt: 1.5,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&::before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        disableAutoFocusItem
      >
        <LanguageSelect />
        {hasStaffAccess && (
          <>
            <Divider />
            <FavoritePrograms />
            <Divider />
          </>
        )}
        <UserInformation />
        <Divider />
        <Logout />
      </Menu>
    </>
  )
}

export default ProfileMenu
