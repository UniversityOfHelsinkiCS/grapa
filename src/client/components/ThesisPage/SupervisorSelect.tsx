import React, { Dispatch, SetStateAction } from 'react'
import ErrorIcon from '@mui/icons-material/Error'
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { User } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'

const SupervisorSelect: React.FC<{
  supervisors: User[]
  supervisorSelections: SupervisorSelection[]
  setSupervisorSelections: Dispatch<SetStateAction<SupervisorSelection[]>>
}> = ({ supervisors, supervisorSelections, setSupervisorSelections }) => {
  const { t } = useTranslation()

  const handleSupervisorChange = (index: number, supervisorId: string) => {
    setSupervisorSelections((prevSelections) => {
      const updatedSelections = [...prevSelections]
      updatedSelections[index].userId = supervisorId
      return updatedSelections
    })
  }

  const handlePercentageChange = (index: number, percentage: number) => {
    setSupervisorSelections((prevSelections) => {
      const updatedSelections = [...prevSelections]
      updatedSelections[index].percentage = percentage
      return updatedSelections
    })
  }

  const handleAddSupervisor = () => {
    setSupervisorSelections((prevSelections) => [
      ...prevSelections,
      { userId: '', percentage: 0 },
    ])
  }

  const handleRemoveSupervisor = (index: number) => {
    setSupervisorSelections((prevSelections) => {
      const updatedSelections = [...prevSelections]
      updatedSelections.splice(index, 1)
      return updatedSelections
    })
  }

  const getTotalPercentage = () =>
    supervisorSelections.reduce(
      (total, selection) => total + selection.percentage,
      0
    )
  const totalPercentage = getTotalPercentage()

  return (
    <Stack spacing={3}>
      {supervisorSelections.map((selection, index) => (
        // eslint-disable-next-line react/no-array-index-key
        <Stack key={index} spacing={1} direction="row">
          <FormControl fullWidth>
            <InputLabel id={`supervisor-select-label-${index}`}>
              Select supervisor
            </InputLabel>
            <Select
              required
              value={selection.userId}
              label="Select supervisor"
              name={`supervisorId-${index}`}
              onChange={(event) =>
                handleSupervisorChange(index, event.target.value as string)
              }
            >
              {supervisors.map((supervisor) => (
                <MenuItem key={supervisor.id} value={supervisor.id}>
                  {supervisor.firstName} {supervisor.lastName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            required
            type="number"
            sx={{ width: 125 }}
            inputProps={{ min: 1, max: 100 }}
            label="Percentage"
            value={selection.percentage}
            onChange={(event) =>
              handlePercentageChange(index, parseInt(event.target.value, 10))
            }
          />
          <Button onClick={() => handleRemoveSupervisor(index)}>Remove</Button>
        </Stack>
      ))}
      {totalPercentage !== 100 && (
        <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
          {t('thesisForm:supervisionPercentageError')}
        </Alert>
      )}
      <Button onClick={handleAddSupervisor}>Add Supervisor</Button>
    </Stack>
  )
}

export default SupervisorSelect
