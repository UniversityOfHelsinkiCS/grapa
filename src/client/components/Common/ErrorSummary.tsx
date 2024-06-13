import { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { red } from '@mui/material/colors'
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined'
import { useTranslation } from 'react-i18next'

interface ErrorSummaryProps {
  // eslint-disable-next-line react/require-default-props
  autofocus?: boolean
  label: string
  children: React.ReactNode
}

const ErrorSummary = ({
  autofocus = false,
  label,
  children,
}: ErrorSummaryProps) => {
  const { t } = useTranslation()

  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autofocus) labelRef.current?.focus()
  }, [autofocus])

  return (
    <Box
      aria-label={t('errorSummary:ariaLabel')}
      aria-atomic="true"
      sx={{
        borderLeft: (theme) => `6px solid ${theme.palette.error.main}`,
        backgroundColor: red[100],
        padding: '2rem',
        margin: '1rem',
      }}
    >
      <Box
        ref={labelRef}
        tabIndex={-1}
        sx={{
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ReportOutlinedIcon color="error" sx={{ mr: '0.5rem' }} aria-hidden />
        <Typography
          component="h2"
          sx={{
            fontSize: '1.125rem',
            fontWeight: 'bold',
            letterSpacing: '0.05em',
            lineHeight: '24px',
          }}
        >
          {label}
        </Typography>
      </Box>
      <Box
        component="ol"
        sx={{
          listStyle: 'inside',
          '& li': {
            marginBottom: '0.25rem',
          },
        }}
      >
        {children}
      </Box>
    </Box>
  )
}

export default ErrorSummary
