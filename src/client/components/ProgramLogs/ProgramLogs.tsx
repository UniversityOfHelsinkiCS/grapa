/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'

import useEvents from '../../hooks/useEvents'
import { useTheses } from '../../hooks/useTheses'

const ProgramLogs = () => {
  const { t } = useTranslation()

  const { theses, isLoading: thesesLoading } = useTheses({
    onlySupervised: true,
  })
  // const { events, isLoading: eventsLoading } = useEvents()

  return (
    <Box component="section" sx={{ px: '3rem', py: '2rem', width: '100%' }}>
      <Typography component="h1" variant="h4">
        {t('programLogsPage:pageTitle')}
      </Typography>
    </Box>
  )
}

export default ProgramLogs
