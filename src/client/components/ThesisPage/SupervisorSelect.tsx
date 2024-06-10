import React, { useEffect } from 'react'
import { Button, Stack } from '@mui/material'
import { AuthorData, SupervisionData } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { useTranslation } from 'react-i18next'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import SingleSupervisorSelect from './SingleSupervisorSelect'

const SupervisorSelect: React.FC<{
  supervisorSelections: SupervisorSelection[]
  setSupervisorSelections: (newSupervisions: SupervisionData[]) => void
}> = ({ supervisorSelections, setSupervisorSelections }) => {
  const { t } = useTranslation()
  const { user, isLoading } = useLoggedInUser()

  useEffect(() => {
    if (user) {
      setSupervisorSelections([{ user, percentage: 100 }])
    }
  }, [isLoading])

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
    const defaultPercentage = (1 / numberOfSupervisors) * 100

    const updatedSelections = supervisorSelections.map((selection) => ({
      ...selection,
      percentage: Math.floor(defaultPercentage),
    }))

    setSupervisorSelections([
      ...updatedSelections,
      { user: null, percentage: Math.floor(defaultPercentage) },
    ])
  }

  const handleRemoveSupervisor = (index: number) => {
    const updatedSelections = [...supervisorSelections]
    updatedSelections.splice(index, 1)
    if (updatedSelections.length === 0) return // Do not allow removing all supervisors

    setSupervisorSelections(updatedSelections)
  }

  if (isLoading) return null

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
