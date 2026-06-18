import { TranslatedName } from '@backend/types'
import { Program, StudyTrack } from '../db/models'
import { mangleData } from './mangleData'

interface ImporterStudyTrack {
  id: string
  name: TranslatedName
  programCode: string
}

const studyTracksHandler = async (studyTracks: ImporterStudyTrack[]) => {
  const existingTracks = await StudyTrack.findAll()

  for (const { name, programCode, id } of studyTracks) {
    let track = existingTracks.find((t) => t.sisuId === id)
    let isOld = false

    if (!track) {
      // Fallback: match by old name & program code to backfill sisuId
      track = existingTracks.find(
        (t) =>
          t.programId === programCode &&
          t.name?.fi === name?.fi &&
          t.name?.en === name?.en
      )

      isOld = track != undefined
    }

    if (track) {
      // Update sisuId and name if it changed
      if (isOld) {
        await track.update({ sisuId: id })
      } else {
        await track.update({ name })
      }
    } else {
      // Create new
      await StudyTrack.create({
        name,
        programId: programCode,
        sisuId: id,
      })
    }
  }
}

export const fetchStudyTracks = async () => {
  const programCodes = (await Program.findAll({ attributes: ['id'] })).map(
    (program) => program.id
  )

  await mangleData({
    url: 'studytracks',
    limit: 10_000,
    handler: studyTracksHandler,
    queryParams: { codes: programCodes },
  })
}
