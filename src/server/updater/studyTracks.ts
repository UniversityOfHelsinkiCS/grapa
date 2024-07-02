import { TranslatedName } from '@backend/types'
import { Program, StudyTrack } from '../db/models'
import { mangleData } from './mangleData'
import { safeBulkCreate } from './util'

interface ImporterStudyTrack {
  id: string
  name: TranslatedName
  programCode: string
}

const studyTracksHandler = async (studyTracks: ImporterStudyTrack[]) => {
  const parsedStudyTracks = studyTracks.map(({ name, programCode }) => ({
    name,
    programId: programCode,
  }))

  // By default updates all fields on duplicate id
  await safeBulkCreate({
    entityName: 'StudyTrack',
    entities: parsedStudyTracks,
    bulkCreate: async (e, opt) => StudyTrack.bulkCreate(e, opt),
    fallbackCreate: async (e, opt) => StudyTrack.upsert(e, opt),
    options: {
      ignoreDuplicates: true,
    },
  })
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
