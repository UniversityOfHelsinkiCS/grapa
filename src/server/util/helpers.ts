import { ThesisData, SupervisionData, TitleData } from '../types'
import { titlesGraderGroup } from '../services/thesisHelpers'
import { getPrimaryStudyTrackId } from './studyTracks'
export const getTotalPercentage = (supervisions: SupervisionData[]) =>
  supervisions.reduce((total, selection) => total + selection.percentage, 0)

// Helper function to transform a single thesis data
export const transformSingleThesis = (
  thesis: ThesisData,
  graderTitles: TitleData[]
) => {
  const mappedStudyTrackId =
    getPrimaryStudyTrackId(
      (thesis as any).program?.options || (thesis as any).Program?.options,
      thesis.studyTrackId
    ) || thesis.studyTrackId

  return {
    ...thesis,
    studyTrackId: mappedStudyTrackId,
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
    seminarSupervisions: (thesis.seminarSupervisions ?? [])
      .map((seminarSupervision) => ({
        ...seminarSupervision,
        isExternal: seminarSupervision.user.isExternal,
      }))
      .sort((a, b) => (a.isExternal ? 1 : b.isExternal ? -1 : 0)),
  }
}

// Transforms the raw query data to suitably formatted data for the frontend
export const transformThesisData = (
  thesisData: ThesisData[],
  graderTitles: TitleData[][] // Array of title arrays
) =>
  thesisData.map((thesis, idx) =>
    transformSingleThesis(thesis, graderTitles[idx])
  )
