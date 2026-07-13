import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import HowToRegIcon from '@mui/icons-material/HowToReg'
import HowToRegOutlinedIcon from '@mui/icons-material/HowToRegOutlined'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

import { fiFI, enUS } from '@mui/x-data-grid/locales'

import useUsers from '../../hooks/useUsers'
import usePrograms from '../../hooks/usePrograms'
import { useDebounce } from '../../hooks/useDebounce'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import useProgramManagements from '../../hooks/useProgramManagements'
import {
  useCreateProgramManagementMutation,
  useDeleteProgramManagementMutation,
  useUpdateProgramManagementMutation,
} from '../../hooks/useProgramManagementMutation'
import useStudyTrackManagements from '../../hooks/useStudyTrackManagements'
import {
  useCreateStudyTrackManagementMutation,
  useDeleteStudyTrackManagementMutation,
} from '../../hooks/useStudyTrackManagementMutation'
import useDepartments from '../../hooks/useDepartments'
import useDepartmentAdmins from '../../hooks/useDepartmentAdmins'
import {
  useCreateDepartmentAdminMutation,
  useDeleteDepartmentAdminMutation,
} from '../../hooks/useDepartmentAdminMutation'

import Popup from '../Common/Popup'

import {
  ProgramManagementData,
  TranslationLanguage,
  DepartmentAdminData,
  StudyTrackManagementData,
  ProgramData,
  StudyTrackData,
  DepartmentData,
} from '@backend/types'

interface Props {
  filteringEntityId?: string
  hideTitle?: boolean
  entityType?: 'program' | 'studyTrack' | 'department'
}

type EntityPermissionData =
  | ProgramManagementData
  | DepartmentAdminData
  | StudyTrackManagementData
type EntityData = ProgramData | StudyTrackData | DepartmentData

const ManageEntityPermissions = ({
  filteringEntityId,
  hideTitle,
  entityType = 'program',
}: Props) => {
  const { t, i18n } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()
  const { language } = i18n as { language: TranslationLanguage }

  const [entityId, setEntityId] = useState(null)
  const [managerCandidate, setManagerCandidate] = useState(null)
  const [isThesisApprover, setIsThesisApprover] = useState(true)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletedPermission, setDeletedPermission] =
    useState<EntityPermissionData | null>(null)

  const { programs: programEntities, studyTracks } = usePrograms({
    includeNotManaged: user?.isAdmin,
    includeManagedStudyTracks: true,
  })
  const { departments } = useDepartments({ includeNotManaged: false })

  const entities =
    entityType === 'department'
      ? departments
      : entityType === 'program'
        ? programEntities
        : studyTracks

  const { programManagements } = useProgramManagements(
    entityType === 'program'
      ? filteringEntityId
        ? {
            programId: filteringEntityId,
            onlyThesisApprovers: false,
            limitToEditorsPrograms: undefined,
          }
        : undefined
      : undefined
  )

  const { studyTrackManagements } = useStudyTrackManagements(
    entityType === 'studyTrack' && filteringEntityId
      ? { studyTrackId: filteringEntityId }
      : undefined
  )

  const { departmentAdmins } = useDepartmentAdmins()

  let filteredDepartmentAdmins = departmentAdmins ?? []
  if (entityType === 'department' && filteringEntityId) {
    filteredDepartmentAdmins = filteredDepartmentAdmins.filter(
      (departmentAdmin) =>
        String(departmentAdmin.departmentId) === filteringEntityId
    )
  }

  const permissions =
    entityType === 'department'
      ? filteredDepartmentAdmins
      : entityType === 'program'
        ? programManagements
        : studyTrackManagements

  const { mutateAsync: createProgramManagement } =
    useCreateProgramManagementMutation()
  const { mutateAsync: deleteProgramManagement } =
    useDeleteProgramManagementMutation()
  const { mutateAsync: updateProgramManagement } =
    useUpdateProgramManagementMutation()

  const { mutateAsync: createStudyTrackManagement } =
    useCreateStudyTrackManagementMutation()
  const { mutateAsync: deleteStudyTrackManagement } =
    useDeleteStudyTrackManagementMutation()

  const { mutateAsync: createDepartmentAdmin } =
    useCreateDepartmentAdminMutation()
  const { mutateAsync: deleteDepartmentAdmin } =
    useDeleteDepartmentAdminMutation()

  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  useEffect(() => {
    if (filteringEntityId) {
      setEntityId(filteringEntityId)
      return
    }

    setEntityId(null)
  }, [filteringEntityId])

  const selectableEntities = filteringEntityId
    ? entities?.filter((entity) => entity.id === filteringEntityId)
    : entities
  const isSingleEntityView = Boolean(filteringEntityId)

  const handleAddPermission = async () => {
    if (managerCandidate && entityId) {
      if (entityType === 'program') {
        await createProgramManagement({
          userId: managerCandidate.id,
          programId: entityId,
          isThesisApprover,
        })
      } else if (entityType === 'studyTrack') {
        await createStudyTrackManagement({
          userId: managerCandidate.id,
          studyTrackId: entityId,
        })
      } else {
        await createDepartmentAdmin({
          userId: managerCandidate.id,
          departmentId: entityId,
        })
      }
      setManagerCandidate(null)
      setUserSearch('')
      if (isSingleEntityView) {
        setEntityId(filteringEntityId)
      } else {
        setEntityId(null)
      }
    }
  }

  if (!user || userLoading || !entities || !permissions) return null
  if (
    !user.isAdmin &&
    ((entityType === 'department' && !user.managedDepartmentIds?.length) ||
      (entityType === 'program' && !user.managedProgramIds?.length) ||
      (entityType === 'studyTrack' &&
        !user.managedProgramIds?.length &&
        !user.managedStudyTrackIds?.length))
  )
    return <Navigate to="/" />

  const dataGridLocale = language === 'fi' ? fiFI : enUS

  const columns: GridColDef<any>[] = [
    ...(entityType === 'program'
      ? [
          {
            field: 'more-actions',
            type: 'actions' as const,
            headerName: t('manageEntityPermissions:toggleApproval'),
            sortable: false,
            width: 157,
            renderCell: (params: any) => (
              <Tooltip
                arrow
                slotProps={{
                  popper: {
                    sx: {
                      '& .MuiTooltip-tooltip': {
                        fontSize: '0.9rem',
                      },
                    },
                  },
                }}
                title={
                  params.row.isThesisApprover
                    ? t('manageEntityPermissions:disallowThesisApprovalButton')
                    : t('manageEntityPermissions:allowThesisApprovalButton')
                }
              >
                <IconButton
                  aria-label="toggle-thesis-approver"
                  type="button"
                  onClick={() =>
                    updateProgramManagement({
                      programManagementId: params.row.id,
                      isThesisApprover: !params.row.isThesisApprover,
                    })
                  }
                  color={params.row.isThesisApprover ? 'success' : 'error'}
                  data-testid={`toggle-thesis-approver-button-${params.row.userId}`}
                >
                  {params.row.isThesisApprover ? (
                    <HowToRegIcon fontSize="large" />
                  ) : (
                    <HowToRegOutlinedIcon fontSize="large" />
                  )}
                </IconButton>
              </Tooltip>
            ),
          },
        ]
      : []),
    {
      field: 'user',
      headerName: t('userHeader'),
      flex: 1,
      valueGetter: (value: any, row: any) => {
        const user = value || row?.user
        return user
          ? `${user.lastName} ${user.firstName} ${user.email ? ` (${user.email})` : ''}`
          : ''
      },
    },
    {
      field:
        entityType === 'program'
          ? 'program'
          : entityType === 'studyTrack'
            ? 'studyTrack'
            : 'department',
      headerName:
        entityType === 'program'
          ? t('programHeader')
          : entityType === 'studyTrack'
            ? t('studyTrackHeader', 'Study Track')
            : t('departmentHeader'),
      flex: 1,
      valueGetter: (value: EntityData | null | undefined) =>
        value?.name?.[language] || '',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      sortable: false,
      renderCell: (params) => (
        <IconButton
          aria-label="delete"
          type="button"
          onClick={() => {
            setDeleteDialogOpen(true)
            setDeletedPermission(
              params.row as ProgramManagementData | DepartmentAdminData
            )
          }}
          color="error"
          data-testid={`delete-${entityType}-management-button-${params.row.userId}`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Box
      component="section"
      sx={{
        px: '1rem',
        py: '2rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!hideTitle && (
        <Typography component="h1" variant="h4">
          {entityType === 'department'
            ? t('manageEntityPermissions:departmentTitle')
            : entityType === 'program'
              ? t('manageEntityPermissions:programTitle')
              : t('manageEntityPermissions:studyTrackTitle')}
        </Typography>
      )}
      <DataGrid
        sx={{ mt: hideTitle ? 0 : '2rem' }}
        rows={permissions}
        columns={columns}
        pageSizeOptions={[100]}
        localeText={
          dataGridLocale.components.MuiDataGrid.defaultProps.localeText
        }
      />
      <Box
        sx={{
          width: '50%',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem',
          mt: '2rem',
          mx: 'auto',
        }}
      >
        <Typography component="h2" variant="h6">
          {entityType === 'department'
            ? t('manageEntityPermissions:addDepartmentManagement')
            : entityType === 'program'
              ? t('manageEntityPermissions:addProgramManagement')
              : t('manageEntityPermissions:addStudyTrackManagement')}
        </Typography>
        <FormControl fullWidth>
          <Autocomplete
            id="program-manager"
            noOptionsText={t('userSearchNoOptions')}
            data-testid="program-manager-select-input"
            disablePortal
            options={users ?? []}
            getOptionLabel={(programManager) =>
              `${programManager.firstName} ${programManager.lastName} ${programManager.email ? `(${programManager.email})` : ''} ${programManager.username ? `(${programManager.username})` : ''}`
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={
                  entityType === 'department'
                    ? t('manageEntityPermissions:adminHeader')
                    : t('manageEntityPermissions:managerHeader')
                }
                required
              />
            )}
            inputValue={userSearch}
            filterOptions={(x) => x}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            value={managerCandidate}
            onChange={(_, value) => {
              setManagerCandidate(value)
            }}
            onInputChange={(_, value) => {
              setUserSearch(value)
            }}
          />
        </FormControl>
        {!isSingleEntityView && (
          <FormControl fullWidth>
            <InputLabel id="program-select-label">
              {entityType === 'program'
                ? t('manageEntityPermissions:programHeader')
                : entityType === 'studyTrack'
                  ? t('manageEntityPermissions:studyTrackHeader')
                  : t('manageEntityPermissions:departmentHeader')}
            </InputLabel>
            <Select
              data-testid="program-select-input"
              labelId="program-select-label"
              label={
                entityType === 'program'
                  ? t('manageEntityPermissions:programHeader')
                  : entityType === 'studyTrack'
                    ? t('manageEntityPermissions:studyTrackHeader')
                    : t('manageEntityPermissions:departmentHeader')
              }
              value={entityId ?? ''}
              onChange={(e) => setEntityId(e.target.value as string)}
            >
              {selectableEntities.map((program) => (
                <MenuItem
                  key={program.id}
                  value={program.id}
                  data-testid={`program-select-item-${program.id}`}
                >
                  {program.name[language]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {entityType === 'program' && (
          <FormControlLabel
            control={
              <Switch
                checked={isThesisApprover}
                onChange={(e) => setIsThesisApprover(e.target.checked)}
              />
            }
            label={t('manageEntityPermissions:allowThesisApprovalButton')}
          />
        )}
        <Button
          type="submit"
          variant="contained"
          data-testid="add-program-management-button"
          disabled={!entityId || !managerCandidate}
          onClick={handleAddPermission}
          fullWidth
          sx={{ borderRadius: '0.5rem' }}
        >
          {t('submitButton')}
        </Button>
      </Box>
      {deletedPermission && (
        <Popup
          open={deleteDialogOpen}
          testId="delete-confirm"
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedPermission(null)
          }}
          onSubmit={async () => {
            if (entityType === 'program') {
              await deleteProgramManagement(deletedPermission.id)
            } else if (entityType === 'studyTrack') {
              await deleteStudyTrackManagement(deletedPermission.id)
            } else {
              await deleteDepartmentAdmin(deletedPermission.id)
            }
            setDeleteDialogOpen(false)
            setDeletedPermission(null)
          }}
          title={
            entityType === 'department'
              ? t('manageEntityPermissions:removeDepartmentManagementTitle')
              : entityType === 'program'
                ? t('manageEntityPermissions:removeProgramManagementTitle')
                : t('manageEntityPermissions:removeStudyTrackManagementTitle')
          }
          submitText={t('deleteButton')}
          submitButtonProps={{ 'data-testid': 'delete-confirm-button' } as any}
          submitColor="error"
          cancelText={t('cancelButton')}
        >
          <Box>
            {entityType === 'department'
              ? t('manageEntityPermissions:removeDepartmentManagementContent', {
                  name: `${deletedPermission.user.firstName} ${deletedPermission.user.lastName}`,
                  department: (deletedPermission as DepartmentAdminData)
                    .department?.name[language],
                })
              : entityType === 'program'
                ? t('manageEntityPermissions:removeProgramManagementContent', {
                    name: `${deletedPermission.user.firstName} ${deletedPermission.user.lastName}`,
                    program: (deletedPermission as ProgramManagementData)
                      .program?.name[language],
                  })
                : t(
                    'manageEntityPermissions:removeStudyTrackManagementContent',
                    {
                      name: `${deletedPermission.user.firstName} ${deletedPermission.user.lastName}`,
                      studyTrack: (
                        deletedPermission as StudyTrackManagementData
                      ).studyTrack?.name[language],
                    }
                  )}
          </Box>
        </Popup>
      )}
    </Box>
  )
}

export default ManageEntityPermissions
