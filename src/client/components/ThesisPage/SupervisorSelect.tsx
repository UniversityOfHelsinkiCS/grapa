import React from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { SupervisionData, User } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { useTranslation } from 'react-i18next'

const SupervisorSelect: React.FC<{
  supervisors: User[]
  supervisorSelections: SupervisorSelection[]
  setSupervisorSelections: (newSupervisions: SupervisionData[]) => void
}> = ({ supervisors, supervisorSelections, setSupervisorSelections }) => {
  const { t } = useTranslation()

  const handleSupervisorChange = (index: number, supervisorId: string) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections[index].userId = supervisorId
    setSupervisorSelections(updatedSelections)
  }

  const handlePercentageChange = (index: number, percentage: number) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections[index].percentage = percentage
    setSupervisorSelections(updatedSelections)
  }

  const handleAddSupervisor = () => {
    setSupervisorSelections([
      ...supervisorSelections,
      { userId: '', percentage: 100 },
    ])
  }

  const handleRemoveSupervisor = (index: number) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections.splice(index, 1)
    setSupervisorSelections(updatedSelections)
  }

  const selectedSupervisorIds = supervisorSelections.map(
    (selection) => selection.userId
  )

  return (
    <Stack spacing={3}>
      {supervisorSelections.map((selection, index) => {
        // filter out supervisors that are already selected
        const supervisorOptions = supervisors.filter(
          (supervisor) =>
            supervisor.id === selection.userId ||
            !selectedSupervisorIds.includes(supervisor.id)
        )

        return (
          // eslint-disable-next-line react/no-array-index-key
          <Stack key={index} spacing={1} direction="row">
            <FormControl fullWidth>
              <InputLabel id={`supervisor-${index}-select-label`}>
                {t('thesisForm:selectSupervisor')}
              </InputLabel>
              <Select
                required
                value={selection.userId}
                label="Select supervisor"
                name={`supervisor-${index}`}
                onChange={(event) =>
                  handleSupervisorChange(index, event.target.value as string)
                }
              >
                {supervisorOptions.map((supervisor) => (
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
              label={t('thesisForm:selectSupervisorPercentage')}
              value={selection.percentage}
              onChange={(event) =>
                handlePercentageChange(index, parseInt(event.target.value, 10))
              }
            />
            <Button onClick={() => handleRemoveSupervisor(index)}>
              {t('removeButton')}
            </Button>
          </Stack>
        )
      })}
      <Button
        disabled={supervisorSelections.length === supervisors.length}
        onClick={handleAddSupervisor}
      >
        {t('thesisForm:addSupervisor')}
      </Button>
    </Stack>
  )
}

export default SupervisorSelect
