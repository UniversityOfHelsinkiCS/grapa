import express, { Response } from 'express'
import { Program, ProgramManagement } from '../db/models'
import { RequestWithUser } from '../types'
import ethesisUserHandler from '../middleware/ethesisUser'
import { getPrograms, getProgramEventLogs } from '../services/programService'

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

    const result = await getProgramEventLogs(
      programId,
      {
        search,
        limit: limit as string,
        offset: offset as string,
        nonAdminOnly: nonAdminOnly as string,
      },
      req.user
    )
    return res.json(result)
  }
)

export default programRouter
