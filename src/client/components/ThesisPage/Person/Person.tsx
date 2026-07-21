import { EmployeeUser as User } from '@backend/validators/userResponse'
import { Stack, Typography } from '@mui/material'

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
  const primaryText =
    `${user.firstName} ${user.lastName}` +
    (percentage != undefined ? ` (${percentage}%)` : '')
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
          {primaryText}
          {showStudentNumber && user.studentNumber && (
            <Typography
              sx={{
                fontFamily: 'monospace',
                lineHeight: 1.25,
                fontSize: '0.8rem',
                fontWeight: 300,
              }}
            >
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
            {title}
          </Typography>
        )}
        <Typography
          sx={{ fontSize: '10pt', lineHeight: 1, color: '#005a94' }}
          component="a"
          href={'mailto:' + user.email}
        >
          {secondaryText}
        </Typography>
      </Stack>
    </>
  )
}
