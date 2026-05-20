import express, { Response } from 'express'
import { literal, Op } from 'sequelize'

import { Program, ProgramManagement, User } from '../db/models'
import { RequestWithUser } from '../types'
import ethesisUserHandler from '../middleware/ethesisUser'
import {
  employeesAndAdminOnly,
  has_access,
} from '../middleware/employeesAndAdmin'
import { cleanUserProperties } from '../services/studentService'

const programManagementRouter = express.Router()

const getProgramIdFilter = (
  isAdmin: boolean,
  limitToEditorsPrograms: boolean,
  programId: string | undefined
) => {
  const programIdFilter = []
  if (!isAdmin && limitToEditorsPrograms) {
    programIdFilter.push({
      [Op.in]: literal(
        `(SELECT program_id FROM program_managements WHERE user_id = $editorUserId)`
      ),
    })
  }
  if (programId && programId !== 'own') {
    programIdFilter.push({
      [Op.eq]: programId,
    })
  }
  return programIdFilter
}

programManagementRouter.get(
  '/',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user
    const { programId, onlyThesisApprovers, limitToEditorsPrograms } = req.query

    const programIdFilter = getProgramIdFilter(
      isAdmin,
      limitToEditorsPrograms === 'true',
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
      raw: true,
      nest: true,
    })

    if (!has_access(req.user)) {
      const filtered = programs.map((program) => {
        //@ts-expect-error it exists
        if (program.user) program.user = cleanUserProperties(program.user)
        return program
      })
      res.send(filtered)
      return
    }

    res.send(programs)
  }
)

programManagementRouter.use(employeesAndAdminOnly)

programManagementRouter.delete(
  '/:id',
  ethesisUserHandler,
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
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { user: editorUser } = req
    const { programId, userId: targetUserId, isThesisApprover } = req.body
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
      isThesisApprover,
    })
    res.status(201).send(programManagement)
  }
)

programManagementRouter.put(
  '/:id',
  ethesisUserHandler,
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
