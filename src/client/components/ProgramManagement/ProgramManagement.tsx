import React, { useState } from 'react'
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
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { DataGrid, GridColDef } from '@mui/x-data-grid'
import useProgramManagements from '../../hooks/useProgramManagements'
import {
  useCreateProgramManagementMutation,
  useDeleteProgramManagementMutation,
} from '../../hooks/useProgramManagementMutation'
import useUsers from '../../hooks/useUsers'
import { useDebounce } from '../../hooks/useDebounce'
import usePrograms from '../../hooks/usePrograms'
import {
  ProgramManagementData,
  TranslationLanguage,
} from '../../../server/types'

const ProgramManagement = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const [programId, setProgramId] = useState(null)
  const [managerCandidate, setManagerCandidate] = useState(null)

  const { programs } = usePrograms({ includeNotManaged: false })
  const { programManagements } = useProgramManagements()
  const { mutateAsync: createProgramManagement } =
    useCreateProgramManagementMutation()
  const { mutateAsync: deleteProgramManagement } =
    useDeleteProgramManagementMutation()

  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch, onlyEmployees: true })

  const handleAddProgramManagement = async () => {
    if (managerCandidate && programId) {
      await createProgramManagement({
        userId: managerCandidate.id,
        programId,
      })
      setManagerCandidate(null)
      setProgramId(null)
    }
  }

  const handleDeleteProgramManagement = async (id: string) => {
    await deleteProgramManagement(id)
  }

  if (!programs || !programManagements) return null

  const columns: GridColDef<ProgramManagementData>[] = [
    {
      field: 'user',
      headerName: 'User',
      flex: 1,
      valueGetter: ({ firstName, lastName, email }) =>
        `${firstName} ${lastName}${email ? ` (${email})` : ''}`,
    },
    {
      field: 'program',
      headerName: 'Program',
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
          onClick={() => handleDeleteProgramManagement(params.row.id)}
          color="error"
          data-testid={`delete-program-management-button-${params.row.userId}`}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      ),
    },
  ]

  return (
    <Box component="section" sx={{ px: '3rem', py: '2rem', width: '100%' }}>
      <Typography component="h1" variant="h4">
        {t('programManagementPage:pageTitle')}
      </Typography>
      <DataGrid
        sx={{ mt: '2rem' }}
        rows={programManagements}
        columns={columns}
        pageSize={5}
        rowsPerPageOptions={[5]}
        autoHeight
      />
      <Box
        sx={{
          maxWidth: '480px',
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
          <InputLabel>{t('programManagementPage:programHeader')}</InputLabel>
          <Select
            data-testid="program-select-input"
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
    </Box>
  )
}

export default ProgramManagement
