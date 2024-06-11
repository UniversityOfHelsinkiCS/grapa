import { SupervisorSelection } from '@frontend/types'

export const getEqualSupervisorSelectionWorkloads = (
  numberOfSupervisors: number,
  supervisorSelections: SupervisorSelection[]
) => {
  const defaultPercentage = (1 / numberOfSupervisors) * 100

  const updatedSelections = supervisorSelections.map((selection) => ({
    ...selection,
    percentage: Math.floor(defaultPercentage),
  }))

  return updatedSelections
}
