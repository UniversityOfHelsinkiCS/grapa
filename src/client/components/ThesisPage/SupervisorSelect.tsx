import React from 'react'
import { Button, Stack } from '@mui/material'
import { AuthorData, SupervisionData } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { useTranslation } from 'react-i18next'
import SingleSupervisorSelect from './SingleSupervisorSelect'
import { getEqualSupervisorSelectionWorkloads } from './util'

const SupervisorSelect: React.FC<{
  supervisorSelections: SupervisorSelection[]
  setSupervisorSelections: (newSupervisions: SupervisionData[]) => void
}> = ({ supervisorSelections, setSupervisorSelections }) => {
  const { t } = useTranslation()

  const handleSupervisorChange = (index: number, supervisor: AuthorData) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections[index].user = supervisor
    setSupervisorSelections(updatedSelections)
  }

  const handlePercentageChange = (index: number, percentage: number) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections[index].percentage = percentage
    setSupervisorSelections(updatedSelections)
  }

  const handleAddSupervisor = () => {
    const numberOfSupervisors = supervisorSelections.length + 1

    const updatedSelections = getEqualSupervisorSelectionWorkloads(
      numberOfSupervisors,
      supervisorSelections
    )

    setSupervisorSelections([
      ...updatedSelections,
      { user: null, percentage: Math.floor(updatedSelections[0].percentage) },
    ])
  }

  const handleRemoveSupervisor = (index: number) => {
    const initialSelections = [...supervisorSelections]
    initialSelections.splice(index, 1)
    if (initialSelections.length === 0) return // Do not allow removing all supervisors

    const numberOfSupervisors = initialSelections.length
    const updatedSelections = getEqualSupervisorSelectionWorkloads(
      numberOfSupervisors,
      initialSelections
    )

    setSupervisorSelections(updatedSelections)
  }

  return (
    <Stack spacing={3}>
      {supervisorSelections.map((selection, index) => (
        <SingleSupervisorSelect
          key={selection.user?.id ?? index}
          selection={selection}
          handleSupervisorChange={(supervisor) =>
            handleSupervisorChange(index, supervisor)
          }
          handleRemoveSupervisor={() => handleRemoveSupervisor(index)}
          handlePercentageChange={(percentage) =>
            handlePercentageChange(index, percentage)
          }
          disabled={supervisorSelections.length === 1}
        />
      ))}
      {supervisorSelections.length < 5 && (
        <Button type="button" onClick={handleAddSupervisor}>
          {t('thesisForm:addSupervisor')}
        </Button>
      )}
    </Stack>
  )
}

export default SupervisorSelect
