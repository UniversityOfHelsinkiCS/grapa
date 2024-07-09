import express, { Response } from 'express'
import { literal, Op } from 'sequelize'

import { Program, ProgramManagement, User } from '../db/models'
import { RequestWithUser } from '../types'

const programManagementRouter = express.Router()

programManagementRouter.get(
  '/',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user
    const programs = await ProgramManagement.findAll({
      attributes: ['id', 'programId', 'userId'],
      where: isAdmin
        ? {}
        : {
            programId: {
              [Op.in]: literal(
                `(SELECT program_id FROM program_managements WHERE user_id = $editorUserId)`
              ),
            },
          },
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
      order: [['programId', 'ASC']],
      bind: { editorUserId: req.user.id },
    })

    res.send(programs)
  }
)

programManagementRouter.delete(
  '/:id',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { user: editorUser } = req
    const { isAdmin } = editorUser
    let whereClause: any = { id: req.params.id }
    if (!isAdmin) {
      // if not admin, check if user has access to the program
      const programsUserHasAccessTo = await ProgramManagement.findAll({
        attributes: ['programId'],
        where: {
          userId: editorUser.id,
        },
      })

      whereClause = {
        ...whereClause,
        programId: programsUserHasAccessTo.map((program) => program.programId),
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
    const { user: editorUser } = req
    const { programId, userId: targetUserId } = req.body
    const { isAdmin } = req.user
    if (!isAdmin) {
      // if not admin, check if user has access to the program
      const userHasAccessToProgram = await ProgramManagement.findOne({
        attributes: ['programId'],
        where: {
          userId: editorUser.id,
          programId,
        },
      })

      if (!userHasAccessToProgram) {
        res.status(403).send({ error: 'Forbidden' })
        return
      }
    }

    const programManagement = await ProgramManagement.create({
      programId,
      userId: targetUserId,
    })
    res.status(201).send(programManagement)
  }
)

export default programManagementRouter
