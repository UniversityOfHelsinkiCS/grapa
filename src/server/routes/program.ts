import { Includeable, literal } from 'sequelize'
import express, { Response } from 'express'
import {
  EventLog,
  Program,
  ProgramManagement,
  StudyTrack,
  Thesis,
} from '../db/models'
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

programRouter.get(
  '/:id/event-log',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const { id: programId } = req.params

    if (!programId || typeof programId !== 'string') {
      return res.status(400).send('Program ID is required')
    }

    // check if the current usr is an admin
    // or if they are a program manager for the program
    const { isAdmin } = req.user
    const programManagement = await ProgramManagement.findOne({
      where: { userId: req.user.id, programId },
    })
    if (!isAdmin && !programManagement) {
      return res.status(403).send('Unauthorized')
    }

    const events = await EventLog.findAll({
      include: [
        'user',
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
          ],
          required: true,
        },
      ],
      order: [['createdAt', 'DESC']],
    })
    return res.json(events)
  }
)

export default programRouter
