import {
  Program,
  ProgramManagement,
  StudyTrack,
  StudyTrackManagement,
} from '../db/models'
import { Includeable, literal } from 'sequelize'
import { getVisibleStudyTracks } from '../util/studyTracks'

export const getProgram = async (id: string, language: string) => {
  const includes: Includeable[] = [
    {
      model: StudyTrack,
      attributes: ['id', 'name', 'programId'],
      as: 'studyTracks',
    },
  ]

  const allowedLanguages = ['fi', 'sv', 'en']
  if (!allowedLanguages.includes(language)) {
    throw new Error('Invalid language key')
  }
  const program = await Program.findOne({
    attributes: ['id', 'name', 'options', 'enabled'],
    where: {
      id: id,
    },
    include: includes,
    bind: { language },
  })

  const jsonProgram = program?.toJSON() as any
  if (jsonProgram && jsonProgram.studyTracks) {
    jsonProgram.allStudyTracks = jsonProgram.studyTracks
    jsonProgram.studyTracks = getVisibleStudyTracks(
      jsonProgram.options,
      jsonProgram.studyTracks
    )
  }

  return jsonProgram
}

export const getPrograms = async (
  includeDisabled: boolean,
  includeNotManaged: boolean,
  isAdmin: boolean,
  language: string,
  favoriteProgramIds: string[],
  userId: string,
  includeManagedStudyTracks: boolean = false
) => {
  const whereClause = {
    ...(!includeDisabled && { enabled: true }),
  }

  const includes: Includeable[] = [
    {
      model: StudyTrack,
      attributes: ['id', 'name', 'programId'],
      as: 'studyTracks',
    },
  ]

  // Validate that the language is one of the allowed keys
  const allowedLanguages = ['fi', 'sv', 'en']
  if (!allowedLanguages.includes(language)) {
    throw new Error('Invalid language key')
  }

  const programs = await Program.findAll({
    attributes: ['id', 'name', 'options', 'enabled'],
    where: whereClause,
    include: includes,
    order: [[literal(`"Program"."name"->>$language`), 'ASC']],
    bind: { language },
  })

  const managedPrograms = await ProgramManagement.findAll({
    attributes: ['programId'],
    where: { userId },
    raw: true,
  })
  const managedProgramIds = new Set(
    managedPrograms.map(
      (programManagement) => programManagement.programId as string
    )
  )

  const managedStudyTracks = await StudyTrackManagement.findAll({
    attributes: ['studyTrackId'],
    where: { userId },
    raw: true,
  })
  const managedStudyTrackIds = new Set(
    managedStudyTracks.map((stm) => stm.studyTrackId)
  )

  const programsWithFavorites = programs.map((program) => {
    const jsonProgram = program.toJSON() as any
    return {
      ...jsonProgram,
      allStudyTracks: jsonProgram.studyTracks,
      studyTracks: getVisibleStudyTracks(
        jsonProgram.options,
        jsonProgram.studyTracks
      ).map((st: any) => ({
        ...st,
        isManaged:
          managedProgramIds.has(program.id) || managedStudyTrackIds.has(st.id),
      })),
      isFavorite: favoriteProgramIds.includes(program.id),
      isManaged: managedProgramIds.has(program.id),
    }
  })

  let result = programsWithFavorites
  if (!isAdmin && !includeNotManaged) {
    result = result.filter(
      (p) =>
        p.isManaged ||
        (includeManagedStudyTracks &&
          p.studyTracks.some((st: any) => st.isManaged))
    )
  }

  return result
}
