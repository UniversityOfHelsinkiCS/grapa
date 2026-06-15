import { useMutation } from '@tanstack/react-query'
import apiClient from '../util/apiClient'
import { useSnackbar } from 'notistack'
import { useTranslation } from 'react-i18next'

export const useRunUpdaterMutation = () => {
  const { enqueueSnackbar } = useSnackbar()
  const { t } = useTranslation()

  const mutationFn = async () => {
    await apiClient.post('/admin/updater')
  }

  return useMutation({
    mutationFn,
    onSuccess: () => {
      enqueueSnackbar(t('adminOtherPage:updaterSuccess'), {
        variant: 'success',
      })
    },
    onError: () => {
      enqueueSnackbar(t('adminOtherPage:updaterFailed'), { variant: 'error' })
    },
  })
}
