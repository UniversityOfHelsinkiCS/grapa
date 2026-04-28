import { Includeable, literal } from 'sequelize'
import express, { Response } from 'express'
import {
  EventLog,
  Program,
  ProgramManagement,
  StudyTrack,
  Thesis,
  User,
} from '../db/models'
import { RequestWithUser } from '../types'
import ethesisUserHandler from '../middleware/ethesisUser'

const programRouter = express.Router()

const userCanManageProgram = async (userId: string, programId: string) => {
  const programManagement = await ProgramManagement.findOne({
    attributes: ['programId'],
    where: { userId, programId },
  })

  return Boolean(programManagement)
}

programRouter.get(
  '/',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
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
      attributes: ['id', 'name', 'options'],
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

    res.send(programsWithFavorites)
  }
)

programRouter.put(
  '/:id',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { id: programId } = req.params
    const { isAdmin, id: userId } = req.user
    const { options } = req.body

    if (!programId || typeof programId !== 'string') {
      return res.status(400).send({ error: 'Program ID is required' })
    }

    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      return res.status(400).send({ error: 'Invalid options payload' })
    }

    if (!isAdmin) {
      const canManageProgram = await userCanManageProgram(userId, programId)

      if (!canManageProgram) {
        return res.status(403).send({ error: 'Forbidden' })
      }
    }

    const program = await Program.findByPk(programId)

    if (!program) {
      return res.status(404).send({ error: 'Program not found' })
    }

    const [, updatedPrograms] = await Program.update(
      { options },
      {
        where: { id: programId },
        returning: true,
      }
    )

    return res.status(200).send(updatedPrograms[0])
  }
)

programRouter.get(
  '/:id/event-log',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const { id: programId } = req.params
    const { nonAdminOnly } = req.query

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
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          where: nonAdminOnly === 'true' ? { isAdmin: false } : {},
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
