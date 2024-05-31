import React from 'react'
import { Button, Stack } from '@mui/material'
import { AuthorData, SupervisionData } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { useTranslation } from 'react-i18next'
import SingleSupervisorSelect from './SingleSupervisorSelect'

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
    setSupervisorSelections([
      ...supervisorSelections,
      { user: null, percentage: 100 },
    ])
  }

  const handleRemoveSupervisor = (index: number) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections.splice(index, 1)
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
        />
      ))}
      <Button onClick={handleAddSupervisor}>
        {t('thesisForm:addSupervisor')}
      </Button>
    </Stack>
  )
}

export default SupervisorSelect
