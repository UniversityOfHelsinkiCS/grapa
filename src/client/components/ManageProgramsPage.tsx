import React from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import usePrograms, { useUpdateProgramMutation } from '../hooks/usePrograms'
import useLoggedInUser from '../hooks/useLoggedInUser'
import ManageTranslations from './Common/ManageTranslations'

const ManageProgramsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()

  const { programs, isLoading: programsLoading } = usePrograms({
    includeNotManaged: true,
  })

  const updateProgramMutation = useUpdateProgramMutation()

  if (userLoading || programsLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" />

  return (
    <ManageTranslations
      pageTitle={t('navbar:managePrograms')}
      autocompleteLabel={t('navbar:program', 'Program')}
      noOptionsText={t('userSearchNoOptions', 'No programs found')}
      items={programs || []}
      isPending={updateProgramMutation.isPending}
      onSave={async (id, name) => {
        const program = programs?.find((p) => p.id === id)
        await updateProgramMutation.mutateAsync({
          programId: id,
          options: program?.options || {},
          name,
        })
      }}
      confirmTitle={t('manageProgramsPage:confirmSaveTitle')}
      confirmText={t('manageProgramsPage:confirmSaveText')}
    />
  )
}

export default ManageProgramsPage
