import { Program, ProgramManagement, StudyTrack } from '../db/models'
import { Includeable, literal } from 'sequelize'

export const getProgram = async (id: string, language: string) => {
  const includes: Includeable[] = [
    {
      model: StudyTrack,
      attributes: ['id', 'name', 'programId'],
      as: 'studyTracks',
    },
  ]

  const allowedLanguages = ['en', 'fi', 'sv']
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

  return program
}

export const getPrograms = async (
  includeDisabled: boolean,
  includeNotManaged: boolean,
  isAdmin: boolean,
  language: string,
  favoriteProgramIds: string[],
  userId: string
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

  if (!isAdmin && !includeNotManaged) {
    includes.push({
      model: ProgramManagement,
      attributes: [],
      where: { userId: userId },
      required: true,
    })
  }

  // Validate that the language is one of the allowed keys
  const allowedLanguages = ['en', 'fi', 'sv']
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
    raw: true,
  })
  const managedProgramIds = new Set(
    managedPrograms.map(
      (programManagement) => programManagement.programId as string
    )
  )

  const programsWithFavorites = programs.map((program) => ({
    ...program.toJSON(),
    isFavorite: favoriteProgramIds.includes(program.id),
    isManaged: managedProgramIds.has(program.id),
  }))

  return programsWithFavorites
}
