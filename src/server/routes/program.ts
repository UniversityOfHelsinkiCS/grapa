import express, { Response } from 'express'
import { Op } from 'sequelize'
import {
  EventLog,
  Program,
  ProgramManagement,
  Thesis,
  User,
} from '../db/models'
import { RequestWithUser } from '../types'
import ethesisUserHandler from '../middleware/ethesisUser'
import { getPrograms } from '../services/programService'
import { formatSearchQuery } from '../util/search'
import { sequelize } from '../db/connection'

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
    const includeManagedStudyTracks =
      req.query.includeManagedStudyTracks === 'true'
    const language = (req.query.language ?? 'en') as string
    const { isAdmin, favoriteProgramIds, id } = req.user
    const result = await getPrograms(
      includeDisabled,
      includeNotManaged,
      isAdmin,
      language,
      favoriteProgramIds,
      id,
      includeManagedStudyTracks
    )
    res.send(result)
  }
)

programRouter.put(
  '/:id',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { id: programId } = req.params
    const { isAdmin, id: userId } = req.user
    const { options, name, enabled } = req.body

    if (!programId || typeof programId !== 'string') {
      return res.status(400).send({ error: 'Program ID is required' })
    }

    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      return res.status(400).send({ error: 'Invalid options payload' })
    }

    if (name && (typeof name !== 'object' || Array.isArray(name))) {
      return res.status(400).send({ error: 'Invalid name payload' })
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

    const updateData: any = { options }
    if (name) {
      updateData.name = name
    }
    if (enabled !== undefined) {
      updateData.enabled = enabled
    }

    const [, updatedPrograms] = await Program.update(updateData, {
      where: { id: programId },
      returning: true,
    })

    return res.status(200).send(updatedPrograms[0])
  }
)

programRouter.get(
  '/:id/event-log',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const { id: programId } = req.params
    const { nonAdminOnly, limit, offset } = req.query

    if (!programId || typeof programId !== 'string') {
      return res.status(400).send('Program ID is required')
    }

    const search = req.query.search as string | undefined

    // check if the current usr is an admin
    // or if they are a program manager for the program
    const { isAdmin } = req.user
    const programManagement = await ProgramManagement.findOne({
      where: { userId: req.user.id, programId },
    })
    if (!isAdmin && !programManagement) {
      return res.status(403).send('Unauthorized')
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
    return res.json({ events: result.rows, totalCount: result.count })
  }
)

export default programRouter
