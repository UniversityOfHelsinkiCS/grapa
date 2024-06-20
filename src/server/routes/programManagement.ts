import express, { Response } from 'express'
import { Program, ProgramManagement, User } from '../db/models'
import { RequestWithUser } from '../types'

const programManagementRouter = express.Router()

programManagementRouter.get(
  '/',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user
    const programs = await ProgramManagement.findAll({
      where: isAdmin ? {} : { userId: req.user.id },
      include: [
        {
          model: User,
          as: 'user',
        },
        {
          model: Program,
          as: 'program',
        },
      ],
    })

    res.send(programs)
  }
)

programManagementRouter.delete(
  '/:id',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user
    let whereClause: any = { id: req.params.id }
    if (!isAdmin) {
      // if not admin, check if user has access to the program
      const programs = await ProgramManagement.findAll({
        attributes: ['programId'],
        where: {
          userId: req.user.id,
        },
      })

      whereClause = {
        ...whereClause,
        programId: programs.map((program) => program.programId),
      }
    }

    const programManagement = await ProgramManagement.findOne({
      where: whereClause,
    })
    if (!programManagement) {
      res.status(404).send({ error: 'Program management not found' })
      return
    }
    await programManagement.destroy()
    res.status(204).send(programManagement)
  }
)

programManagementRouter.post(
  '/',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { programId, userId } = req.body
    const { isAdmin } = req.user
    if (!isAdmin) {
      // if not admin, check if user has access to the program
      const programs = await ProgramManagement.findOne({
        attributes: ['programId'],
        where: {
          userId: req.user.id,
          programId,
        },
      })

      if (!programs) {
        res.status(403).send({ error: 'Forbidden' })
        return
      }
    }

    const programManagement = await ProgramManagement.create({
      programId,
      userId,
    })
    res.status(201).send(programManagement)
  }
)

export default programManagementRouter
