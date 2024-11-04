import { Includeable, literal } from 'sequelize'
import express, { Response } from 'express'
import { Program, ProgramManagement, StudyTrack } from '../db/models'
import { RequestWithUser } from '../types'

const programRouter = express.Router()

// @ts-expect-error the user middleware updates the req object with user field
programRouter.get('/', async (req: RequestWithUser, res: Response) => {
  const includeDisabled = req.query.includeDisabled === 'true'
  const includeNotManaged = req.query.includeNotManaged === 'true'
  const language = (req.query.language ?? 'en') as string

  const { isAdmin, favoriteProgramIds } = req.user

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
      where: { userId: req.user.id },
      required: true,
    })
  }

  // Validate that the language is one of the allowed keys
  const allowedLanguages = ['en', 'fi', 'sv']
  if (!allowedLanguages.includes(language)) {
    throw new Error('Invalid language key')
  }

  const programs = await Program.findAll({
    attributes: ['id', 'name'],
    where: whereClause,
    include: includes,
    order: [[literal(`"Program"."name"->>$language`), 'ASC']],
    bind: { language },
  })

  const programsWithFavorites = programs.map((program) => ({
    ...program.toJSON(),
    isFavorite: favoriteProgramIds.includes(program.id),
  }))

  res.send(programsWithFavorites)
})

export default programRouter
