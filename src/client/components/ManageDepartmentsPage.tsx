import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Button,
  TextField,
  Box,
  FormControlLabel,
  Switch,
  Alert,
} from '@mui/material'

import useDepartments, {
  useUpdateDepartmentMutation,
  useCreateDepartmentMutation,
} from '../hooks/useDepartments'
import useLoggedInUser from '../hooks/useLoggedInUser'
import ManageEntity from './Common/ManageEntity'
import { TranslatedName } from '@backend/types'
import Popup from './Common/Popup'

const ManageDepartmentsPage: React.FC = () => {
  const { t } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()

  const { departments, isLoading: departmentsLoading } = useDepartments({
    includeNotManaged: true,
    includeDisabled: true,
  })

  const updateDepartmentMutation = useUpdateDepartmentMutation()
  const createDepartmentMutation = useCreateDepartmentMutation()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [draftDepartment, setDraftDepartment] = useState<{
    name: TranslatedName
    enabled: boolean
  }>({
    name: { fi: '', sv: '', en: '' },
    enabled: true,
  })

  if (userLoading || departmentsLoading) return null
  if (!user?.isAdmin) return <Navigate to="/" />

  const handleCreateSave = async () => {
    await createDepartmentMutation.mutateAsync({
      name: draftDepartment.name,
      enabled: draftDepartment.enabled,
    })
    setCreateDialogOpen(false)
    setDraftDepartment({
      name: { fi: '', sv: '', en: '' },
      enabled: true,
    })
  }

  const isCreateDisabled =
    createDepartmentMutation.isPending ||
    !draftDepartment.name.fi ||
    !draftDepartment.name.sv ||
    !draftDepartment.name.en

  return (
    <Box sx={{ width: '100%', position: 'relative' }}>
      <ManageEntity
        pageTitle={t('manageDepartmentsPage:pageTitle')}
        autocompleteLabel={t('manageDepartmentsPage:chooseDepartmentLabel')}
        noOptionsText={t('manageDepartmentsPage:noDepartmentsFound')}
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

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, mb: 4 }}>
        <Button variant="contained" onClick={() => setCreateDialogOpen(true)}>
          {t('manageDepartmentsPage:addDepartment')}
        </Button>
      </Box>

      <Popup
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        title={t('manageDepartmentsPage:addDepartmentTitle')}
        fullWidth
        maxWidth="sm"
        onSubmit={handleCreateSave}
        submitText={
          createDepartmentMutation.isPending ? t('saving') : t('submitButton')
        }
        submitDisabled={isCreateDisabled}
        cancelText={t('cancelButton')}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <Alert severity="warning">
            {t('manageDepartmentsPage:deleteWarning')}
          </Alert>
          <TextField
            label={t('manageProgramsPage:finnishName')}
            value={draftDepartment.name.fi}
            onChange={(e) =>
              setDraftDepartment({
                ...draftDepartment,
                name: { ...draftDepartment.name, fi: e.target.value },
              })
            }
            fullWidth
            required
          />
          <TextField
            label={t('manageProgramsPage:englishName')}
            value={draftDepartment.name.en}
            onChange={(e) =>
              setDraftDepartment({
                ...draftDepartment,
                name: { ...draftDepartment.name, en: e.target.value },
              })
            }
            fullWidth
            required
          />
          <TextField
            label={t('manageProgramsPage:swedishName')}
            value={draftDepartment.name.sv}
            onChange={(e) =>
              setDraftDepartment({
                ...draftDepartment,
                name: { ...draftDepartment.name, sv: e.target.value },
              })
            }
            fullWidth
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={draftDepartment.enabled}
                onChange={(e) =>
                  setDraftDepartment({
                    ...draftDepartment,
                    enabled: e.target.checked,
                  })
                }
              />
            }
            label={t('common:enabled')}
          />
        </Box>
      </Popup>
    </Box>
  )
}

export default ManageDepartmentsPage
