import { ThesisData } from '@backend/types'
import { SupervisorSelection } from '@frontend/types'

export const getTotalPercentage = (thesis: ThesisData) =>
  thesis.supervisions.reduce(
    (total, selection) => total + selection.percentage,
    0
  )

export const getEqualSupervisorSelectionWorkloads = (
  numberOfSupervisors: number,
  supervisorSelections: SupervisorSelection[]
) => {
  const defaultPercentage = (1 / numberOfSupervisors) * 100
  const roundedDefaultPercentage = Math.floor(defaultPercentage)

  const totalPercentage = roundedDefaultPercentage * numberOfSupervisors

  const updatedSelections = supervisorSelections.map((selection, index) => {
    // Check if the total percentage is less than 100%
    if (index === 0 && totalPercentage < 100) {
      // Adjust the first selection's percentage to make the total 100%
      const difference = 100 - totalPercentage

      return {
        ...selection,
        percentage: roundedDefaultPercentage + difference,
      }
    }

    return {
      ...selection,
      percentage: roundedDefaultPercentage,
    }
  })

  return updatedSelections
}