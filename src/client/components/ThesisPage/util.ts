import sortBy from 'lodash-es/sortBy'
import {
  DepartmentData,
  ProgramData,
  SupervisionData,
  ThesisData,
  TranslatedName,
} from '@backend/types'
import { SupervisorSelection } from '@frontend/types'
import { ThesisSchema, ThesisDateSchema } from './thesisValidator'

type ProgramOrDepartment = DepartmentData | ProgramData

export const getSortedPrograms = (
  programs: ProgramOrDepartment[],
  language: string
) =>
  sortBy(programs, (program) => program.name[language as keyof TranslatedName])

export const getTotalPercentage = (supervisions: SupervisionData[]) =>
  supervisions.reduce((total, selection) => total + selection.percentage, 0)

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

export const getFormErrors = (thesis: ThesisData) => {
  const validatedThesis = ThesisSchema.safeParse(thesis)
  const validatedDates = ThesisDateSchema.safeParse({
    startDate: thesis.startDate,
    targetDate: thesis.targetDate,
  })

  const formErrors = []

  if (!validatedThesis?.success)
    formErrors.push(...validatedThesis.error.issues)
  if (!validatedDates?.success) formErrors.push(...validatedDates.error.issues)

  return formErrors
}
