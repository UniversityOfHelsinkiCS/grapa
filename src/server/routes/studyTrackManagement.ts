import express, { Response } from 'express'

import {
  StudyTrack,
  StudyTrackManagement,
  ProgramManagement,
  User,
} from '../db/models'
import { RequestWithUser, User as UserType } from '../types'
import ethesisUserHandler from '../middleware/ethesisUser'
import {
  employeesAndAdminOnly,
  has_access,
} from '../middleware/employeesAndAdmin'
import { cleanUserProperties } from '../services/studentService'

const studyTrackManagementRouter = express.Router()

studyTrackManagementRouter.get(
  '/',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { studyTrackId } = req.query

    let whereClause = {}
    if (studyTrackId) {
      whereClause = { studyTrackId }
    }

    const managements = (await StudyTrackManagement.findAll({
      attributes: ['id', 'studyTrackId', 'userId'],
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
        },
        {
          model: StudyTrack,
          as: 'studyTrack',
        },
      ],
      order: [
        ['studyTrackId', 'ASC'],
        ['user', 'lastName', 'ASC'],
      ],
      raw: true,
      nest: true,
    })) as (StudyTrackManagement & { user?: UserType })[]

    if (!has_access(req.user)) {
      const filtered = managements.map((management) => {
        if (management.user)
          management.user = cleanUserProperties(management.user)
        return management
      })
      res.send(filtered)
      return
    }

    res.send(managements)
  }
)

studyTrackManagementRouter.use(employeesAndAdminOnly)

const userCanManageStudyTrack = async (
  userId: string,
  programId: string,
  studyTrackId?: string
) => {
  const programManagement = await ProgramManagement.findOne({
    attributes: ['programId'],
    where: { userId, programId },
  })

  if (programManagement) return true

  if (studyTrackId) {
    const studyTrackManagement = await StudyTrackManagement.findOne({
      attributes: ['studyTrackId'],
      where: { userId, studyTrackId },
    })
    if (studyTrackManagement) return true
  }

  return false
}

studyTrackManagementRouter.delete(
  '/:id',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { user: editorUser } = req
    const { isAdmin } = editorUser
    const { id: managementId } = req.params

    const targetManagement = await StudyTrackManagement.findByPk(
      managementId as string,
      {
        include: [{ model: StudyTrack, as: 'studyTrack' }],
      }
    )

    if (!targetManagement) {
      res.status(404).send({ error: 'Study track management not found' })
      return
    }

    if (!isAdmin) {
      const canManage = await userCanManageStudyTrack(
        editorUser.id,
        // @ts-expect-error it exists
        targetManagement.studyTrack.programId,
        targetManagement.studyTrackId
      )

      if (!canManage) {
        res.status(403).send({ error: 'Forbidden' })
        return
      }
    }

    await targetManagement.destroy()
    res.status(204).send(targetManagement)
  }
)

studyTrackManagementRouter.post(
  '/',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { user: editorUser } = req
    const { studyTrackId, userId: targetUserId } = req.body
    const { isAdmin } = req.user

    const studyTrack = await StudyTrack.findByPk(studyTrackId)
    if (!studyTrack) {
      return res.status(404).send({ error: 'Study track not found' })
    }

    if (!isAdmin) {
      const canManage = await userCanManageStudyTrack(
        editorUser.id,
        studyTrack.programId,
        studyTrackId
      )

      if (!canManage) {
        res.status(403).send({ error: 'Forbidden' })
        return
      }
    }

    const studyTrackManagement = await StudyTrackManagement.create({
      studyTrackId,
      userId: targetUserId,
    })
    res.status(201).send(studyTrackManagement)
  }
)

export default studyTrackManagementRouter
