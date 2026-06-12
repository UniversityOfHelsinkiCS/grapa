import React from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import usePrograms, { useUpdateProgramMutation } from '../hooks/usePrograms'
import useLoggedInUser from '../hooks/useLoggedInUser'
import ManageEntity from './Common/ManageEntity'

const ManageProgramsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()

  const { programs, isLoading: programsLoading } = usePrograms({
    includeNotManaged: true,
    includeDisabled: true,
  })

  const updateProgramMutation = useUpdateProgramMutation()

  if (userLoading || programsLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" />

  return (
    <ManageEntity
      showEditTranslations={false}
      pageTitle={t('manageProgramsPage:pageTitle')}
      autocompleteLabel={t('manageProgramsPage:chooseProgramLabel')}
      noOptionsText={t('manageProgramsPage:noProgramsFound')}
      items={programs || []}
      isPending={updateProgramMutation.isPending}
      onSave={async (id, name, enabled) => {
        const program = programs?.find((p) => p.id === id)
        await updateProgramMutation.mutateAsync({
          programId: id,
          options: program?.options || {},
          name,
          enabled,
        })
      }}
      confirmTitle={t('manageProgramsPage:confirmSaveTitle')}
      confirmText={t('manageProgramsPage:confirmSaveText')}
    />
  )
}

export default ManageProgramsPage
