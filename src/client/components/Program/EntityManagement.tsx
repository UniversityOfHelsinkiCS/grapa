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

import Popup from '../Common/Popup'

import {
  ProgramManagementData,
  TranslationLanguage,
} from '../../../server/types'

interface Props {
  filteringProgramId?: string
  hideTitle?: boolean
  entityType?: 'program' | 'studyTrack'
}
const EntityManagement = ({
  filteringProgramId,
  hideTitle,
  entityType = 'program',
}: Props) => {
  const { t, i18n } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()
  const { language } = i18n as { language: TranslationLanguage }

  const [programId, setProgramId] = useState(null)
  const [managerCandidate, setManagerCandidate] = useState(null)
  const [isThesisApprover, setIsThesisApprover] = useState(true)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletedProgramManagement, setDeletedProgramManagement] = useState(null)

  const { programs: allPrograms } = usePrograms({ includeNotManaged: true })
  const programEntities =
    allPrograms?.filter((p) => user?.isAdmin || p.isManaged) || []
  const studyTracks =
    allPrograms
      ?.flatMap((p) => p.studyTracks || [])
      .filter((st) => user?.isAdmin || st.isManaged) || []

  const entities = entityType === 'program' ? programEntities : studyTracks

  const { programManagements } = useProgramManagements(
    entityType === 'program'
      ? filteringProgramId === 'own'
        ? {
            programId: undefined,
            onlyThesisApprovers: false,
            limitToEditorsPrograms: true,
          }
        : filteringProgramId
          ? {
              programId: filteringProgramId,
              onlyThesisApprovers: false,
              limitToEditorsPrograms: undefined,
            }
          : undefined
      : undefined
  )

  const { studyTrackManagements } = useStudyTrackManagements(
    entityType === 'studyTrack' &&
      filteringProgramId &&
      filteringProgramId !== 'own'
      ? { studyTrackId: filteringProgramId }
      : undefined
  )

  const managements =
    entityType === 'program' ? programManagements : studyTrackManagements

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

  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  useEffect(() => {
    if (filteringProgramId && filteringProgramId !== 'own') {
      setProgramId(filteringProgramId)
      return
    }

    setProgramId(null)
  }, [filteringProgramId])

  const selectablePrograms =
    filteringProgramId && filteringProgramId !== 'own'
      ? entities?.filter((program) => program.id === filteringProgramId)
      : entities
  const isSingleProgramView = Boolean(
    filteringProgramId && filteringProgramId !== 'own'
  )

  const handleAddProgramManagement = async () => {
    if (managerCandidate && programId) {
      if (entityType === 'program') {
        await createProgramManagement({
          userId: managerCandidate.id,
          programId,
          isThesisApprover,
        })
      } else {
        await createStudyTrackManagement({
          userId: managerCandidate.id,
          studyTrackId: programId,
        })
      }
      setManagerCandidate(null)
      setUserSearch('')
      if (isSingleProgramView) {
        setProgramId(filteringProgramId)
      } else {
        setProgramId(null)
      }
    }
  }

  if (!user || userLoading || !entities || !managements) return null
  if (!user.isAdmin && !user.managedProgramIds?.length)
    return <Navigate to="/" />

  const dataGridLocale = language === 'fi' ? fiFI : enUS

  const columns: GridColDef<any>[] = [
    ...(entityType === 'program'
      ? [
          {
            field: 'more-actions',
            type: 'actions' as const,
            headerName: t('programManagementPage:toggleApproval'),
            sortable: false,
            width: 157,
            renderCell: (params: any) => (
              <Tooltip
                arrow
                PopperProps={{
                  sx: {
                    '& .MuiTooltip-tooltip': {
                      fontSize: '0.9rem',
                    },
                  },
                }}
                title={
                  params.row.isThesisApprover
                    ? t('programManagementPage:disallowThesisApprovalButton')
                    : t('programManagementPage:allowThesisApprovalButton')
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
      valueGetter: (value) =>
        value
          ? `${value.lastName} ${value.firstName} ${value.email ? ` (${value.email})` : ''}`
          : '',
    },
    {
      field: entityType === 'program' ? 'program' : 'studyTrack',
      headerName:
        entityType === 'program'
          ? t('programHeader')
          : t('studyTrackHeader', 'Study Track'),
      flex: 1,
      valueGetter: (value) => value?.name?.[language] || '',
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
            setDeletedProgramManagement(params.row as ProgramManagementData)
          }}
          color="error"
          data-testid={`delete-program-management-button-${params.row.userId}`}
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
          {t('programManagementPage:pageTitle')}
        </Typography>
      )}
      <DataGrid
        sx={{ mt: hideTitle ? 0 : '2rem' }}
        rows={managements}
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
          {t('programManagementPage:addProgramManagement')}
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
                label={t('programManagementPage:managerHeader')}
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
        {!isSingleProgramView && (
          <FormControl fullWidth>
            <InputLabel id="program-select-label">
              {t('programManagementPage:programHeader')}
            </InputLabel>
            <Select
              data-testid="program-select-input"
              labelId="program-select-label"
              label={
                entityType === 'program'
                  ? t('programManagementPage:programHeader')
                  : t('studyTrackHeader', 'Study Track')
              }
              value={programId ?? ''}
              onChange={(e) => setProgramId(e.target.value as string)}
            >
              {selectablePrograms.map((program) => (
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
            label={t('programManagementPage:allowThesisApprovalButton')}
          />
        )}
        <Button
          type="submit"
          variant="contained"
          data-testid="add-program-management-button"
          disabled={!programId || !managerCandidate}
          onClick={handleAddProgramManagement}
          fullWidth
          sx={{ borderRadius: '0.5rem' }}
        >
          {t('submitButton')}
        </Button>
      </Box>
      {deletedProgramManagement && (
        <Popup
          open={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedProgramManagement(null)
          }}
          onSubmit={async () => {
            if (entityType === 'program') {
              await deleteProgramManagement(deletedProgramManagement.id)
            } else {
              await deleteStudyTrackManagement(deletedProgramManagement.id)
            }
            setDeleteDialogOpen(false)
            setDeletedProgramManagement(null)
          }}
          title={t('programManagementPage:removeProgramManagementTitle')}
          submitText={t('deleteButton')}
          submitColor="error"
          cancelText={t('cancelButton')}
        >
          <Box>
            {t('programManagementPage:removeProgramManagementContent', {
              name: `${deletedProgramManagement.user.firstName} ${deletedProgramManagement.user.lastName}`,
              program:
                entityType === 'program'
                  ? deletedProgramManagement.program?.name[language]
                  : deletedProgramManagement.studyTrack?.name[language],
            })}
          </Box>
        </Popup>
      )}
    </Box>
  )
}

export default EntityManagement
