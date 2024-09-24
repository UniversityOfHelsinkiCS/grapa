/* eslint-disable no-nested-ternary */
import { ThesisData, SupervisionData } from '@backend/types'

export const getTotalPercentage = (supervisions: SupervisionData[]) =>
  supervisions.reduce((total, selection) => total + selection.percentage, 0)

// Helper function to transform a single thesis data
export const transformSingleThesis = (thesis: ThesisData) => ({
  ...thesis,
  graders: thesis.graders
    .map((grader) => ({
      ...grader,
      isExternal: grader.user.isExternal,
    }))
    .sort((a, b) => (a.isPrimaryGrader ? -1 : b.isPrimaryGrader ? 1 : 0)),
  supervisions: thesis.supervisions
    .map((supervision) => ({
      ...supervision,
      isExternal: supervision.user.isExternal,
    }))
    .sort((a, b) =>
      a.isPrimarySupervisor
        ? -1
        : b.isPrimarySupervisor
          ? 1
          : a.isExternal
            ? 1
            : -1
    ),
})

// Transforms the raw query data to suitably formatted data for the frontend
export const transformThesisData = (thesisData: ThesisData[]) =>
  thesisData.map(transformSingleThesis)
