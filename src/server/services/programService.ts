import {
  Program,
  ProgramManagement,
  StudyTrack,
  StudyTrackManagement,
  EventLog,
  User,
  Thesis,
} from '../db/models'
import { Includeable, literal, Op } from 'sequelize'
import { sequelize } from '../db/connection'
import { getVisibleStudyTracks } from '../util/studyTracks'
import { formatSearchQuery } from '../util/search'
import CustomAuthorizationError from '../errors/AuthorizationError'

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

export interface GetProgramEventLogsOptions {
  search?: string
  limit?: string | number
  offset?: string | number
  nonAdminOnly?: string | boolean
}

export const getProgramEventLogs = async (
  programId: string,
  options: GetProgramEventLogsOptions,
  user: any
) => {
  const { search, limit, offset, nonAdminOnly } = options

  // check if the current user is an admin
  // or if they are a program manager for the program
  const { isAdmin, id: userId } = user
  const programManagement = await ProgramManagement.findOne({
    where: { userId, programId },
  })
  if (!isAdmin && !programManagement) {
    throw new CustomAuthorizationError(
      'Access denied: insufficient permissions for this program',
      {
        programId: ['User is not a program manager or admin for this program'],
      }
    )
  }

  const bind: any = {}
  const where: any = {}

  if (search) {
    const formattedSearch = formatSearchQuery(search)
    if (formattedSearch) {
      bind.search = formattedSearch
      where[Op.and] = [
        sequelize.literal(`(
          EXISTS (SELECT 1 FROM users WHERE users.id = "EventLog".user_id AND users.fts_index @@ to_tsquery('simple', $search))
          OR
          EXISTS (SELECT 1 FROM theses WHERE theses.id = "EventLog".thesis_id AND theses.fts_index @@ to_tsquery('simple', $search))
          OR
          EXISTS (SELECT 1 FROM authors INNER JOIN users ON authors.user_id = users.id WHERE authors.thesis_id = "EventLog".thesis_id AND users.fts_index @@ to_tsquery('simple', $search))
        )`),
      ]
    }
  }

  const result = await EventLog.findAndCountAll({
    where,
    bind,
    limit: limit ? Number(limit) : undefined,
    offset: offset ? Number(offset) : undefined,
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email'],
        where:
          nonAdminOnly === 'true' || nonAdminOnly === true
            ? { isAdmin: false }
            : {},
      },
      {
        model: Thesis,
        as: 'thesis',
        attributes: ['id', 'topic'],
        include: [
          {
            model: Program,
            as: 'program',
            attributes: [],
            where: { id: programId },
            required: true,
          },
          {
            model: User,
            as: 'authors',
            attributes: ['firstName', 'lastName'],
          },
        ],
        required: true,
      },
    ],
    order: [['createdAt', 'DESC']],
  })

  return { events: result.rows, totalCount: result.count }
}
