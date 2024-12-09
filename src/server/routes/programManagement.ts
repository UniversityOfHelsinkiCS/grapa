import express, { Response } from 'express'
import { literal, Op } from 'sequelize'

import { Program, ProgramManagement, User } from '../db/models'
import { RequestWithUser } from '../types'

const programManagementRouter = express.Router()

const getProgramIdFilter = (
  isAdmin: boolean,
  programId: string | undefined
) => {
  const programIdFilter = []
  if (!isAdmin) {
    programIdFilter.push({
      [Op.in]: literal(
        `(SELECT program_id FROM program_managements WHERE user_id = $editorUserId)`
      ),
    })
  }
  if (programId) {
    programIdFilter.push({
      [Op.eq]: programId,
    })
  }
  return programIdFilter
}
programManagementRouter.get(
  '/',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user
    const { programId, onlyThesisApprovers } = req.query

    const programIdFilter = getProgramIdFilter(
      isAdmin,
      programId as string | undefined
    )
    let whereClause = {}
    if (programIdFilter.length) {
      whereClause = {
        ...whereClause,
        programId: {
          [Op.and]: programIdFilter,
        },
      }
    }
    if (onlyThesisApprovers === 'true') {
      whereClause = {
        ...whereClause,
        isThesisApprover: true,
      }
    }

    const programs = await ProgramManagement.findAll({
      attributes: ['id', 'programId', 'userId', 'isThesisApprover'],
      where: whereClause,
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
      order: [
        ['programId', 'ASC'],
        ['user', 'lastName', 'ASC'],
      ],
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
    const { id: programManagementId } = req.params

    const targetProgramManagement =
      await ProgramManagement.findByPk(programManagementId)

    if (!targetProgramManagement) {
      res.status(404).send({ error: 'Program management not found' })
      return
    }

    if (!isAdmin) {
      // if not admin, check if user has access to the program
      const userHasAccessToProgram = await ProgramManagement.findOne({
        attributes: ['programId'],
        where: {
          userId: editorUser.id,
          programId: targetProgramManagement.programId,
        },
      })

      if (!userHasAccessToProgram) {
        res.status(404).send({ error: 'Program management not found' })
        return
      }
    }

    await targetProgramManagement.destroy()
    res.status(204).send(targetProgramManagement)
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

programManagementRouter.put(
  '/:id',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { user: editorUser } = req
    const { isThesisApprover } = req.body
    const { id: programManagementId } = req.params
    const { isAdmin } = req.user

    const targetProgramManagement =
      await ProgramManagement.findByPk(programManagementId)

    if (!targetProgramManagement) {
      res.status(404).send({ error: 'Program management not found' })
      return
    }

    if (!isAdmin) {
      // if not admin, check if user has access to the program
      const userHasAccessToProgram = await ProgramManagement.findOne({
        attributes: ['programId'],
        where: {
          userId: editorUser.id,
          programId: targetProgramManagement.programId,
        },
      })

      if (!userHasAccessToProgram) {
        res.status(404).send({ error: 'Program management not found' })
        return
      }
    }

    const [, updatedProgramManagement] = await ProgramManagement.update(
      {
        isThesisApprover,
      },
      {
        where: {
          id: programManagementId,
        },
        returning: true,
      }
    )

    res.status(200).send(updatedProgramManagement)
  }
)

export default programManagementRouter
