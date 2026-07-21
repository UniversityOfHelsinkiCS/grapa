import { useTranslation } from 'react-i18next'
import { Stack, Typography, Tooltip, IconButton } from '@mui/material'

import { EmployeeUser as User } from '@backend/validators/userResponse'
import { TranslatedName } from '@backend/validators/departmentResponse'

import { ContentCopy } from '@mui/icons-material'
import { Person } from './Person'

interface UserContainer {
  user: Partial<User>
  percentage?: number
  isExternal?: boolean
  isPrimarySupervisor?: boolean
  title?: TranslatedName
  creationTimeIdentifier?: string
}

export const PersonList = ({
  users,
  title,
  showStudentNumber,
  showTitle,
}: {
  users: UserContainer[]
  title: string
  showStudentNumber?: boolean
  showTitle?: boolean
}) => {
  if (!users.length) return null

  const { t, i18n } = useTranslation()
  const { language } = i18n

  return (
    <Stack
      sx={{
        minWidth: '15rem',
      }}
    >
      <Stack direction="row" sx={{ alignItems: 'center' }}>
        <Typography
          component="h4"
          sx={{
            fontSize: '1rem',
            fontWeight: 700,
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>
        <Tooltip title={t('common:copyEmails')}>
          <IconButton
            sx={{
              ml: 'auto',
              opacity: 0.5,
              ':hover': {
                opacity: 1,
              },
            }}
            onClick={() => {
              void navigator.clipboard.writeText(
                users
                  .map((userContainer) => userContainer.user.email)
                  .filter((email) => email)
                  .join('\n')
              )
            }}
          >
            <ContentCopy />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack sx={{ gap: 1.5, my: 1.5 }}>
        {users.map((userContainer) => {
          const title =
            userContainer.title?.fi && userContainer.title?.fi.length > 0
              ? `(${userContainer.title[language as keyof TranslatedName]})`
              : ''

          return (
            <Person
              key={userContainer.user.id}
              user={userContainer.user as unknown as User}
              showStudentNumber={showStudentNumber}
              percentage={userContainer.percentage}
              title={showTitle ? title : null}
            ></Person>
          )
        })}
      </Stack>
    </Stack>
  )
}
