import React from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import useDepartments, {
  useUpdateDepartmentMutation,
} from '../hooks/useDepartments'
import useLoggedInUser from '../hooks/useLoggedInUser'
import ManageEntity from './Common/ManageEntity'

const ManageDepartmentsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()

  const { departments, isLoading: departmentsLoading } = useDepartments({
    includeNotManaged: true,
    includeDisabled: true,
  })

  const updateDepartmentMutation = useUpdateDepartmentMutation()

  if (userLoading || departmentsLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" />

  return (
    <ManageEntity
      pageTitle={t('navbar:manageDepartments')}
      autocompleteLabel={t('navbar:department', 'Department')}
      noOptionsText={t('userSearchNoOptions', 'No departments found')}
      items={departments || []}
      isPending={updateDepartmentMutation.isPending}
      onSave={async (id, name, enabled) => {
        await updateDepartmentMutation.mutateAsync({
          departmentId: id,
          name,
          enabled,
        })
      }}
      confirmTitle={t('manageDepartmentsPage:confirmSaveTitle')}
      confirmText={t('manageDepartmentsPage:confirmSaveText')}
    />
  )
}

export default ManageDepartmentsPage
