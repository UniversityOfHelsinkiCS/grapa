import { ThesisData, SupervisionData, TitleData } from '@backend/types'
import { titlesGraderGroup } from '../routes/thesisHelpers'
export const getTotalPercentage = (supervisions: SupervisionData[]) =>
  supervisions.reduce((total, selection) => total + selection.percentage, 0)

// Helper function to transform a single thesis data
export const transformSingleThesis = (
  thesis: ThesisData,
  graderTitles: TitleData[]
) => ({
  ...thesis,
  graders: thesis.graders
    .map((grader) => ({
      ...grader,
      title: graderTitles
        .filter((obj) => obj?.username === grader.user.username)[0]
        ?.titles.filter((title) =>
          titlesGraderGroup.includes(title.en.toLowerCase())
        )[0] ?? {
        fi: '',
        en: '',
        sv: '',
      },
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
export const transformThesisData = (
  thesisData: ThesisData[],
  graderTitles: TitleData[]
) => thesisData.map((thesis) => transformSingleThesis(thesis, graderTitles))
