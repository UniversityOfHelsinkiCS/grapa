import { ProgramOptions, StudyTrackData } from '@backend/types'

export const getPrimaryStudyTrackId = (
  programOptions: ProgramOptions,
  studyTrackId: string | null | undefined
) => {
  if (!programOptions || !studyTrackId) return studyTrackId

  const combined = programOptions.combinedStudyTracks

  if (combined?.[studyTrackId]) {
    return combined[studyTrackId]
  }

  return studyTrackId
}

export const getVisibleStudyTracks = (
  programOptions: ProgramOptions,
  studyTracks: StudyTrackData[]
) => {
  if (!studyTracks) return []
  if (!programOptions?.combinedStudyTracks) return studyTracks

  const combined = programOptions.combinedStudyTracks

  return studyTracks.filter((track) => !combined[track.id])
}

export const getSecondaryStudyTrackIds = (
  programOptions: ProgramOptions,
  primaryStudyTrackId: string | null | undefined
): string[] => {
  if (!programOptions?.combinedStudyTracks || !primaryStudyTrackId) return []

  const combined = programOptions.combinedStudyTracks

  return Object.entries(combined)
    .filter(([, primaryId]) => primaryId === primaryStudyTrackId)
    .map(([secondaryId]) => secondaryId)
}
