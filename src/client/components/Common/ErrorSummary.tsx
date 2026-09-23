import { useEffect, useRef } from 'react'
import { Box, Typography } from '@mui/material'
import { red } from '@mui/material/colors'
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined'
import { useTranslation } from 'react-i18next'

interface ErrorSummaryProps {
  autofocus?: boolean
  focusKey?: unknown
  label: string
  children: React.ReactNode
}

const ErrorSummary = ({
  autofocus = false,
  focusKey,
  label,
  children,
}: ErrorSummaryProps) => {
  const { t } = useTranslation()

  const summaryRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autofocus) summaryRef.current?.focus()
  }, [autofocus, focusKey])

  return (
    <Box
      ref={summaryRef}
      tabIndex={-1}
      aria-label={t('thesisForm:errorSummaryAriaLabel')}
      data-testid="error-summary"
      sx={{
        borderLeft: (theme) => `6px solid ${theme.palette.error.main}`,
        backgroundColor: red[100],
        padding: '2rem',
        margin: '1rem',
      }}
    >
      <Box role="alert">
        <Box
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
    </Box>
  )
}

export default ErrorSummary
