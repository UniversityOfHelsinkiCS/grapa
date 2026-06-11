import { ProgramData, StudyTrackData } from '@backend/types'

/**
 * Returns the primary study track ID for a given study track ID within a program.
 * If the track is not configured as a secondary track, it returns the input track ID.
 */
export const getPrimaryStudyTrackId = (
  program: ProgramData | undefined,
  studyTrackId: string | null | undefined
): string | null | undefined => {
  if (!program || !studyTrackId) return studyTrackId

  const combined = program.options?.combinedStudyTracks as
    | Record<string, string>
    | undefined

  if (combined?.[studyTrackId]) {
    return combined[studyTrackId]
  }

  return studyTrackId
}

/**
 * Returns the primary StudyTrackData object for a given study track ID within a program.
 */
export const getPrimaryStudyTrack = (
  program: ProgramData | undefined,
  studyTrackId: string | null | undefined
): StudyTrackData | undefined => {
  if (!program || !studyTrackId) return undefined

  const primaryId = getPrimaryStudyTrackId(program, studyTrackId)
  return program.studyTracks?.find((track) => track.id === primaryId)
}

/**
 * Returns a list of study tracks for a program, excluding any secondary tracks that should be hidden.
 */
export const getVisibleStudyTracks = (
  program: ProgramData | undefined
): StudyTrackData[] => {
  if (!program || !program.studyTracks) return []

  const combined = program.options?.combinedStudyTracks as
    | Record<string, string>
    | undefined

  if (!combined) return program.studyTracks

  return program.studyTracks.filter((track) => !combined[track.id])
}
