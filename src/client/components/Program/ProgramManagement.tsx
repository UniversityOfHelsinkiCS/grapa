import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
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

import DeleteConfirmation from '../Common/DeleteConfirmation'

import {
  ProgramManagementData,
  TranslationLanguage,
} from '../../../server/types'

interface Props {
  filteringProgramId?: string
}
const ProgramManagement = ({ filteringProgramId }: Props) => {
  const { t, i18n } = useTranslation()
  const { user, isLoading: userLoading } = useLoggedInUser()
  const { language } = i18n as { language: TranslationLanguage }

  const [programId, setProgramId] = useState(null)
  const [managerCandidate, setManagerCandidate] = useState(null)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletedProgramManagement, setDeletedProgramManagement] = useState(null)

  const { programs } = usePrograms({ includeNotManaged: false })
  const { programManagements } = useProgramManagements(
    filteringProgramId
      ? {
          programId: filteringProgramId,
          onlyThesisApprovers: false,
          limitToEditorsPrograms: true,
        }
      : undefined
  )
  const { mutateAsync: createProgramManagement } =
    useCreateProgramManagementMutation()
  const { mutateAsync: deleteProgramManagement } =
    useDeleteProgramManagementMutation()
  const { mutateAsync: updateProgramManagement } =
    useUpdateProgramManagementMutation()

  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  const handleAddProgramManagement = async () => {
    if (managerCandidate && programId) {
      await createProgramManagement({
        userId: managerCandidate.id,
        programId,
        isThesisApprover: false,
      })
      setManagerCandidate(null)
      setProgramId(null)
    }
  }

  if (!user || userLoading || !programs || !programManagements) return null
  if (!user.isAdmin && !user.managedProgramIds?.length)
    return <Navigate to="/" />

  const dataGridLocale = language === 'fi' ? fiFI : enUS

  const columns: GridColDef<ProgramManagementData>[] = [
    {
      field: 'more-actions',
      type: 'actions',
      headerName: '',
      sortable: false,
      renderCell: (params) => (
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
            color="primary"
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
    {
      field: 'user',
      headerName: t('userHeader'),
      flex: 1,
      valueGetter: ({ firstName, lastName, email }) =>
        `${lastName} ${firstName} ${email ? ` (${email})` : ''}`,
    },
    {
      field: 'program',
      headerName: t('programHeader'),
      flex: 1,
      valueGetter: ({ name }) => name[language],
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
      <Typography component="h1" variant="h4">
        {t('programManagementPage:pageTitle')}
      </Typography>
      <DataGrid
        sx={{ mt: '2rem' }}
        rows={programManagements}
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
          gap: '1rem',
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
        <FormControl fullWidth>
          <InputLabel id="program-select-label">
            {t('programManagementPage:programHeader')}
          </InputLabel>
          <Select
            data-testid="program-select-input"
            labelId="program-select-label"
            label={t('programManagementPage:programHeader')}
            value={programId ?? ''}
            onChange={(e) => setProgramId(e.target.value as string)}
          >
            {programs.map((program) => (
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
        <DeleteConfirmation
          open={deleteDialogOpen}
          setOpen={setDeleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false)
            setDeletedProgramManagement(null)
          }}
          onDelete={async () => {
            await deleteProgramManagement(deletedProgramManagement.id)
            setDeleteDialogOpen(false)
            setDeletedProgramManagement(null)
          }}
          title={t('programManagementPage:removeProgramManagementTitle')}
        >
          <Box>
            {t('programManagementPage:removeProgramManagementContent', {
              name: `${deletedProgramManagement.user.firstName} ${deletedProgramManagement.user.lastName}`,
              program: deletedProgramManagement.program.name[language],
            })}
          </Box>
        </DeleteConfirmation>
      )}
    </Box>
  )
}

export default ProgramManagement
