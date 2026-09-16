import { EmployeeUser as User } from '@backend/validators/userResponse'
import { Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { HiddenLabel } from '../../Common/HiddenLabel'

export const Person = ({
  user,
  percentage,
  title,
  showStudentNumber,
}: {
  user: User
  percentage?: number
  title?: string
  showStudentNumber?: boolean
}) => {
  const { t } = useTranslation()

  const name = `${user.firstName} ${user.lastName}`
  const secondaryText = user.affiliation
    ? `${user.email} (${user.affiliation})`
    : `${user.email}`
  return (
    <>
      <Stack direction="column" sx={{ gap: 0.3 }}>
        <Typography
          component="span"
          sx={{ lineHeight: 1.25, fontSize: '0.875rem', fontWeight: 500 }}
        >
          <HiddenLabel text={t('common:nameLabel')} />
          {name}
          {percentage != undefined && (
            <>
              {' '}
              <HiddenLabel text={t('common:supervisionPercentageHeader')} />
              {`(${percentage}%)`}
            </>
          )}
          {showStudentNumber && user.studentNumber && (
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontFamily: 'monospace',
                lineHeight: 1.25,
                fontSize: '0.8rem',
                fontWeight: 300,
              }}
            >
              <HiddenLabel text={t('common:studentNumberLabel')} />
              {user.studentNumber}
            </Typography>
          )}
        </Typography>
        {title && (
          <Typography
            sx={{
              lineHeight: 1.25,
              fontSize: '0.8rem',
              fontWeight: 300,
            }}
          >
            <HiddenLabel text={t('common:titleLabel')} />
            {title}
          </Typography>
        )}
        <Typography
          sx={{ fontSize: '10pt', lineHeight: 1, color: '#005a94' }}
          component="a"
          href={'mailto:' + user.email}
          aria-label={`${t('common:emailLabel')}, ${secondaryText}`}
        >
          {secondaryText}
        </Typography>
      </Stack>
    </>
  )
}
