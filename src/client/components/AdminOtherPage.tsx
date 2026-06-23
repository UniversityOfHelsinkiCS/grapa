import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  DialogContentText,
} from '@mui/material'
import Popup from './Common/Popup'

import useLoggedInUser from '../hooks/useLoggedInUser'
import { useRunUpdaterMutation } from '../hooks/useAdmin'

const AdminOtherPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const runUpdaterMutation = useRunUpdaterMutation()

  if (userLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" />

  const handleRunClick = () => {
    setConfirmOpen(true)
  }

  const handleConfirmRun = () => {
    runUpdaterMutation.mutate()
    setConfirmOpen(false)
  }

  return (
    <Box
      sx={{
        alignSelf: 'flex-start',
        width: '100%',
        bgcolor: 'background.paper',
      }}
    >
      <Box component="section" sx={{ px: '3rem', py: '2rem' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {t('adminOtherPage:pageTitle')}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('adminOtherPage:runUpdaterTitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('adminOtherPage:runUpdaterDescription')}
              </Typography>
            </CardContent>
            <CardActions>
              <Button
                variant="contained"
                color="primary"
                onClick={handleRunClick}
                disabled={runUpdaterMutation.isPending}
              >
                {runUpdaterMutation.isPending
                  ? t('adminOtherPage:runningUpdater')
                  : t('adminOtherPage:runUpdaterButton')}
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Box>

      <Popup
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t('adminOtherPage:confirmRunTitle')}
        onSubmit={handleConfirmRun}
        submitText={t('adminOtherPage:runUpdaterButton')}
        cancelText={t('cancelButton', 'Cancel')}
      >
        <DialogContentText>
          {t('adminOtherPage:confirmRunDescription')}
        </DialogContentText>
      </Popup>
    </Box>
  )
}

export default AdminOtherPage
