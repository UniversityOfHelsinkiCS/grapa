import { ThesisData, SupervisionData } from '@backend/types'

export const getTotalPercentage = (supervisions: SupervisionData[]) =>
  supervisions.reduce((total, selection) => total + selection.percentage, 0)

export const getEqualSupervisorSelectionWorkloads = (
  numberOfSupervisors: number,
  supervisorSelections: SupervisionData[]
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

// Transforms the raw query data to suitably formatted data for the frontend
export const transformThesisData = (thesisData: ThesisData[]) =>
  thesisData.map((thesis) => ({
    ...thesis,
    graders: thesis.graders.map((grader) => ({
      ...grader,
      isExternal: grader.user.isExternal,
    })),
    supervisions: thesis.supervisions.map((supervision) => ({
      ...supervision,
      isExternal: supervision.user.isExternal,
    })),
  }))
