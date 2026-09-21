import React from 'react'
import { Box, IconButton, Link, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import CloseIcon from '@mui/icons-material/Close'
import FeedbackOutlinedIcon from '@mui/icons-material/FeedbackOutlined'
import { useTranslation } from 'react-i18next'

import { KTDK_FEEDBACK_BANNER_DISMISSED_STORAGE_KEY } from '../../config'
import useLoggedInUser from '../hooks/useLoggedInUser'
import { BreakPointTheme } from '../theme'
import { NewTabHint } from './Common/HiddenLabel'

const KTDK_IAM_GROUPS = ['hy-ktdk-employees', 'hy-ktdk-students']

const KtdkFeedbackBanner = () => {
  const { t } = useTranslation()
  const { user } = useLoggedInUser()
  const [dismissed, setDismissed] = React.useState(
    () =>
      localStorage.getItem(KTDK_FEEDBACK_BANNER_DISMISSED_STORAGE_KEY) ===
      'true'
  )

  const handleDismiss = () => {
    localStorage.setItem(KTDK_FEEDBACK_BANNER_DISMISSED_STORAGE_KEY, 'true')
    setDismissed(true)
  }

  const isKtdkUser = Boolean(
    user?.iamGroups?.some((iamGroup) => KTDK_IAM_GROUPS.includes(iamGroup))
  )

  if (dismissed || !isKtdkUser) return null

  return (
    <Box
      sx={(theme) => ({
        width: '100vw',
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        borderBottom: `1px solid ${theme.palette.primary.main}`,
        '@media print': {
          display: 'none',
        },
      })}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          columnGap: '0.5rem',
          maxWidth: '100rem',
          mx: 'auto',
          width: '100%',
          p: '0.5rem 1rem',
          [BreakPointTheme.breakpoints.up('sm')]: {
            px: '3rem',
          },
        }}
      >
        <FeedbackOutlinedIcon
          sx={(theme) => ({ color: theme.palette.primary.main })}
        />
        <Typography>{t('ktdkFeedbackBanner:text')}</Typography>
        <Link
          href={t('ktdkFeedbackBanner:url')}
          target="_blank"
          rel="noopener"
          underline="hover"
        >
          {t('ktdkFeedbackBanner:linkText')}
          <NewTabHint />
        </Link>
        <IconButton
          onClick={handleDismiss}
          aria-label={t('ktdkFeedbackBanner:dismiss')}
          size="small"
          sx={{ ml: 'auto' }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  )
}

export default KtdkFeedbackBanner
