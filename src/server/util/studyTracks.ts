export const getPrimaryStudyTrackId = (
  programOptions: any,
  studyTrackId: string | null | undefined
): string | null | undefined => {
  if (!programOptions || !studyTrackId) return studyTrackId

  const combined = programOptions.combinedStudyTracks as
    | Record<string, string>
    | undefined

  if (combined?.[studyTrackId]) {
    return combined[studyTrackId]
  }

  return studyTrackId
}

export const getVisibleStudyTracks = <T extends { id: string }>(
  programOptions: any,
  studyTracks: T[] | undefined
): T[] => {
  if (!studyTracks) return []
  if (!programOptions?.combinedStudyTracks) return studyTracks

  const combined = programOptions.combinedStudyTracks as Record<string, string>

  return studyTracks.filter((track) => !combined[track.id])
}

export const getSecondaryStudyTrackIds = (
  programOptions: any,
  primaryStudyTrackId: string | null | undefined
): string[] => {
  if (!programOptions?.combinedStudyTracks || !primaryStudyTrackId) return []

  const combined = programOptions.combinedStudyTracks as Record<string, string>

  return Object.entries(combined)
    .filter(([, primaryId]) => primaryId === primaryStudyTrackId)
    .map(([secondaryId]) => secondaryId)
}
