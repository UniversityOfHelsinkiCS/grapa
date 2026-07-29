import React, { useEffect, useState } from 'react'
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
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
} from '@tanstack/react-table'

import PrethesisTable from '../Common/PrethesisTable'

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
  DepartmentAdminData,
  StudyTrackManagementData,
} from '@backend/validators/managementResponse'
import {
  ProgramData,
  StudyTrackData,
} from '@backend/validators/programResponse'
import {
  DepartmentData,
  TranslationLanguage,
} from '@backend/validators/departmentResponse'

interface Props {
  filteringEntityId?: string
  filteringProgramId?: string
  hideTitle?: boolean
  entityType?: 'program' | 'studyTrack' | 'department'
}

type EntityPermissionData =
  ProgramManagementData | DepartmentAdminData | StudyTrackManagementData
type EntityData = ProgramData | StudyTrackData | DepartmentData

interface PermissionsViewProps {
  filteringEntityId?: string
  hideTitle?: boolean
  entityType: 'program' | 'studyTrack' | 'department'
  entities: EntityData[] | undefined
  permissions: EntityPermissionData[] | undefined
  createMutation: (
    userId: string,
    id: string,
    isThesisApprover: boolean
  ) => Promise<any>
  deleteMutation: (id: string) => Promise<any>
  updateMutation?: (id: string, isThesisApprover: boolean) => Promise<any>
  field: string
  headerName: string
  title: string
  addManagementTitle: string
  adminOrManagerHeader: string
  entitySelectLabel: string
  removeTitle: string
  getRemoveContent: (deletedPerm: any) => string
}

const PermissionsView = ({
  filteringEntityId,
  hideTitle,
  entityType,
  entities,
  permissions,
  createMutation,
  deleteMutation,
  updateMutation,
  field,
  headerName,
  title,
  addManagementTitle,
  adminOrManagerHeader,
  entitySelectLabel,
  removeTitle,
  getRemoveContent,
}: PermissionsViewProps) => {
  const { t, i18n } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()
  const { language } = i18n as { language: TranslationLanguage }

  const [entityId, setEntityId] = useState<string | null>(null)
  const [managerCandidate, setManagerCandidate] = useState<any>(null)
  const [isThesisApprover, setIsThesisApprover] = useState(true)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletedPermission, setDeletedPermission] =
    useState<EntityPermissionData | null>(null)

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

  const isSingleEntityView = Boolean(filteringEntityId)

  const handleAddPermission = async () => {
    if (managerCandidate && entityId) {
      await createMutation(managerCandidate.id, entityId, isThesisApprover)
      setManagerCandidate(null)
      setUserSearch('')
      if (isSingleEntityView) {
        setEntityId(filteringEntityId)
      } else {
        setEntityId(null)
      }
    }
  }

  const columnHelper = createColumnHelper<any>()

  const columns = React.useMemo(() => {
    return [
      ...(entityType === 'program' && updateMutation
        ? [
            columnHelper.display({
              id: 'more-actions',
              header: t('manageEntityPermissions:toggleApproval'),
              cell: (info) => {
                const row = info.row.original
                return (
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
                      row.isThesisApprover
                        ? t(
                            'manageEntityPermissions:disallowThesisApprovalButton'
                          )
                        : t('manageEntityPermissions:allowThesisApprovalButton')
                    }
                  >
                    <IconButton
                      aria-label="toggle-thesis-approver"
                      type="button"
                      onClick={() =>
                        updateMutation(row.id, !row.isThesisApprover)
                      }
                      color={row.isThesisApprover ? 'success' : 'error'}
                      data-testid={`toggle-thesis-approver-button-${row.userId}`}
                    >
                      {row.isThesisApprover ? (
                        <HowToRegIcon fontSize="large" />
                      ) : (
                        <HowToRegOutlinedIcon fontSize="large" />
                      )}
                    </IconButton>
                  </Tooltip>
                )
              },
            }),
          ]
        : []),
      columnHelper.accessor(
        (row: any) => {
          const user = row.user
          return user
            ? `${user.lastName} ${user.firstName} ${user.email ? ` (${user.email})` : ''}`
            : ''
        },
        {
          id: 'user',
          header: t('userHeader'),
          cell: (info) => info.getValue(),
        }
      ),
      columnHelper.accessor(
        (row: any) => {
          const value = row[field] as EntityData | null | undefined
          return value?.name?.[language] || ''
        },
        {
          id: field,
          header: headerName,
          cell: (info) => info.getValue(),
        }
      ),
      columnHelper.display({
        id: 'actions',
        header: '',
        cell: (info) => (
          <IconButton
            aria-label="delete"
            type="button"
            onClick={() => {
              setDeleteDialogOpen(true)
              setDeletedPermission(info.row.original)
            }}
            color="error"
            data-testid={`delete-${entityType}-management-button-${info.row.original.userId}`}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        ),
      }),
    ]
  }, [entityType, updateMutation, t, field, headerName, language])

  const table = useReactTable({
    data: permissions ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

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
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
      )}
      <Box sx={{ mt: hideTitle ? 0 : '2rem' }}>
        <PrethesisTable table={table} />
      </Box>
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
          {addManagementTitle}
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
              <TextField {...params} label={adminOrManagerHeader} required />
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
              {entitySelectLabel}
            </InputLabel>
            <Select
              data-testid="program-select-input"
              labelId="program-select-label"
              label={entitySelectLabel}
              value={entityId ?? ''}
              onChange={(e) => setEntityId(e.target.value as string)}
            >
              {(entities || []).map((entity) => (
                <MenuItem
                  key={entity.id}
                  value={entity.id}
                  data-testid={`program-select-item-${entity.id}`}
                >
                  {entity.name[language]}
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
            await deleteMutation(deletedPermission.id)
            setDeleteDialogOpen(false)
            setDeletedPermission(null)
          }}
          title={removeTitle}
          submitText={t('deleteButton')}
          submitButtonProps={{ 'data-testid': 'delete-confirm-button' } as any}
          submitColor="error"
          cancelText={t('cancelButton')}
        >
          <Box>{getRemoveContent(deletedPermission)}</Box>
        </Popup>
      )}
    </Box>
  )
}

const ManageProgramPermissions = (props: Omit<Props, 'entityType'>) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user } = useLoggedInUser()

  const { programs } = usePrograms({
    includeNotManaged: user?.isAdmin,
    includeManagedStudyTracks: true,
  })

  const { programManagements } = useProgramManagements(
    props.filteringEntityId
      ? {
          programId: props.filteringEntityId,
          onlyThesisApprovers: false,
          limitToEditorsPrograms: undefined,
        }
      : undefined
  )

  const { mutateAsync: createProgramManagement } =
    useCreateProgramManagementMutation()
  const { mutateAsync: deleteProgramManagement } =
    useDeleteProgramManagementMutation()
  const { mutateAsync: updateProgramManagement } =
    useUpdateProgramManagementMutation()

  return (
    <PermissionsView
      {...props}
      entityType="program"
      entities={programs}
      permissions={programManagements}
      createMutation={(userId, id, isThesisApprover) =>
        createProgramManagement({ userId, programId: id, isThesisApprover })
      }
      deleteMutation={deleteProgramManagement}
      updateMutation={(id, isThesisApprover) =>
        updateProgramManagement({ programManagementId: id, isThesisApprover })
      }
      field="program"
      headerName={t('programHeader')}
      title={t('manageEntityPermissions:programTitle')}
      addManagementTitle={t('manageEntityPermissions:addProgramManagement')}
      adminOrManagerHeader={t('manageEntityPermissions:managerHeader')}
      entitySelectLabel={t('manageEntityPermissions:programHeader')}
      removeTitle={t('manageEntityPermissions:removeProgramManagementTitle')}
      getRemoveContent={(deletedPerm: any) =>
        t('manageEntityPermissions:removeProgramManagementContent', {
          name: `${deletedPerm.user.firstName} ${deletedPerm.user.lastName}`,
          program: deletedPerm.program?.name[language],
        })
      }
    />
  )
}

const ManageStudyTrackPermissions = (props: Omit<Props, 'entityType'>) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { user } = useLoggedInUser()

  const { programs, studyTracks } = usePrograms({
    includeNotManaged: user?.isAdmin,
    includeManagedStudyTracks: true,
  })

  let selectableStudyTracks = studyTracks
  if (props.filteringProgramId) {
    const program = programs?.find((p) => p.id === props.filteringProgramId)
    selectableStudyTracks = program?.studyTracks || []
  } else if (props.filteringEntityId) {
    selectableStudyTracks = studyTracks?.filter(
      (st) => st.id === props.filteringEntityId
    )
  }

  const { studyTrackManagements } = useStudyTrackManagements(
    props.filteringEntityId
      ? { studyTrackId: props.filteringEntityId }
      : undefined
  )

  const filteredManagements = props.filteringProgramId
    ? studyTrackManagements?.filter((m) =>
        selectableStudyTracks?.some((st) => st.id === m.studyTrackId)
      )
    : studyTrackManagements

  const { mutateAsync: createStudyTrackManagement } =
    useCreateStudyTrackManagementMutation()
  const { mutateAsync: deleteStudyTrackManagement } =
    useDeleteStudyTrackManagementMutation()

  return (
    <PermissionsView
      {...props}
      entityType="studyTrack"
      entities={selectableStudyTracks}
      permissions={filteredManagements}
      createMutation={(userId, id, _isThesisApprover) =>
        createStudyTrackManagement({ userId, studyTrackId: id })
      }
      deleteMutation={deleteStudyTrackManagement}
      field="studyTrack"
      headerName={t('studyTrackHeader', 'Study Track')}
      title={t('manageEntityPermissions:studyTrackTitle')}
      addManagementTitle={t('manageEntityPermissions:addStudyTrackManagement')}
      adminOrManagerHeader={t('manageEntityPermissions:managerHeader')}
      entitySelectLabel={t('manageEntityPermissions:studyTrackHeader')}
      removeTitle={t('manageEntityPermissions:removeStudyTrackManagementTitle')}
      getRemoveContent={(deletedPerm: any) =>
        t('manageEntityPermissions:removeStudyTrackManagementContent', {
          name: `${deletedPerm.user.firstName} ${deletedPerm.user.lastName}`,
          studyTrack: deletedPerm.studyTrack?.name[language],
        })
      }
    />
  )
}

const ManageDepartmentPermissions = (props: Omit<Props, 'entityType'>) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const { departments } = useDepartments({ includeNotManaged: false })
  const { departmentAdmins } = useDepartmentAdmins()

  let filteredDepartmentAdmins = departmentAdmins ?? []
  if (props.filteringEntityId) {
    filteredDepartmentAdmins = filteredDepartmentAdmins.filter(
      (departmentAdmin) =>
        String(departmentAdmin.departmentId) === props.filteringEntityId
    )
  }

  const { mutateAsync: createDepartmentAdmin } =
    useCreateDepartmentAdminMutation()
  const { mutateAsync: deleteDepartmentAdmin } =
    useDeleteDepartmentAdminMutation()

  return (
    <PermissionsView
      {...props}
      entityType="department"
      entities={departments}
      permissions={filteredDepartmentAdmins}
      createMutation={(userId, id, _isThesisApprover) =>
        createDepartmentAdmin({ userId, departmentId: id })
      }
      deleteMutation={deleteDepartmentAdmin}
      field="department"
      headerName={t('departmentHeader')}
      title={t('manageEntityPermissions:departmentTitle')}
      addManagementTitle={t('manageEntityPermissions:addDepartmentManagement')}
      adminOrManagerHeader={t('manageEntityPermissions:adminHeader')}
      entitySelectLabel={t('manageEntityPermissions:departmentHeader')}
      removeTitle={t('manageEntityPermissions:removeDepartmentManagementTitle')}
      getRemoveContent={(deletedPerm: any) =>
        t('manageEntityPermissions:removeDepartmentManagementContent', {
          name: `${deletedPerm.user.firstName} ${deletedPerm.user.lastName}`,
          department: deletedPerm.department?.name[language],
        })
      }
    />
  )
}

const ManageEntityPermissions = ({
  filteringEntityId,
  filteringProgramId,
  hideTitle,
  entityType = 'program',
}: Props) => {
  if (entityType === 'studyTrack') {
    return (
      <ManageStudyTrackPermissions
        filteringEntityId={filteringEntityId}
        filteringProgramId={filteringProgramId}
        hideTitle={hideTitle}
      />
    )
  }
  if (entityType === 'department') {
    return (
      <ManageDepartmentPermissions
        filteringEntityId={filteringEntityId}
        hideTitle={hideTitle}
      />
    )
  }
  return (
    <ManageProgramPermissions
      filteringEntityId={filteringEntityId}
      hideTitle={hideTitle}
    />
  )
}

export default ManageEntityPermissions
