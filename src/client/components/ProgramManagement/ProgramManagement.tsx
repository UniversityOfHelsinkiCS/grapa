import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Autocomplete,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import useProgramManagements from '../../hooks/useProgramManagements'
import {
  useCreateProgramManagementMutation,
  useDeleteProgramManagementMutation,
} from '../../hooks/useProgramManagementMutation'
import useUsers from '../../hooks/useUsers'
import { useDebounce } from '../../hooks/useDebounce'
import usePrograms from '../../hooks/usePrograms'
import { ProgramManagementData } from '../../../server/types'

const ProgramManagement: React.FC = () => {
  const { t } = useTranslation()

  const [managerCandidate, setManagerCandidate] = useState(null)
  const [programId, setProgramId] = useState(null)

  const { programManagements } = useProgramManagements()
  const { mutateAsync: createProgramManagement } =
    useCreateProgramManagementMutation()
  const { mutateAsync: deleteProgramManagement } =
    useDeleteProgramManagementMutation()

  const { programs } = usePrograms()

  const [userSearch, setUserSearch] = useState('')
  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers({ search: debouncedSearch })

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

  if (!programs) return null

  return (
    <div>
      <Typography variant="h2">Program Managements</Typography>
      <ul style={{ padding: 0 }}>
        {programManagements?.map((management: ProgramManagementData) => (
          <li
            key={
              management.id ?? `${management.userId}-${management.programId}`
            }
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: '1px solid black',
              borderBottom: '1px solid black',
            }}
          >
            <div style={{ alignContent: 'center' }}>
              {management.user.firstName} {management.user.lastName}
              {management.user.email ? ` (${management.user.email})` : ''}
            </div>
            <div style={{ alignContent: 'center' }}>
              {management.program.name.en}
              <Button
                onClick={() => handleDeleteProgramManagement(management.id)}
              >
                Delete
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '15px',
          marginTop: '30px',
        }}
      >
        <Typography variant="h6">Add Program Management</Typography>
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
              <MenuItem key={program.id} value={program.id}>
                {program.name.en}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          data-testid="add-program-management-button"
          disabled={!programId || !managerCandidate}
          onClick={handleAddProgramManagement}
        >
          Add
        </Button>
      </div>
    </div>
  )
}

export default ProgramManagement
