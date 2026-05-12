import express, { Response } from 'express'
import { type Transaction } from 'sequelize'

import {
  ServerDeleteRequest,
  ServerGetRequest,
  ServerPostRequest,
  ServerPutRequest,
  ThesisData,
} from '../types'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMutlipartFormData from '../middleware/attachment'
import {
  Grader,
  SeminarSupervision,
  Thesis,
  Supervision,
  Author,
  Approver,
  EventLog,
} from '../db/models'
import { sequelize } from '../db/connection'
import { validateThesisData } from '../validators/thesis'

import { getPaginatedTheses, createThesis } from '../services/thesisService'
import { authorizeStatusChange } from '../middleware/authorizeStatusChange'
import {
  getAndCreateExtUsers,
  handleGradersChangeEventLog,
  handleStatusChangeEmail,
  handleStatusChangeEventLog,
  handleSupervisionsChangeEventLog,
  handleThesisCreationEmail,
} from './thesisHelpers'
import {
  deleteThesisAttachments,
  handleAttachmentByLabel,
} from './thesisAttachmentHelpers'
import getEthesisAdminStatus from '../middleware/getEthesisAdminStatus'
import ethesisUserHandler from '../middleware/ethesisUser'
import { fetchThesisById, getSingleThesis } from '../services/thesisService'

const thesisRouter = express.Router()

const updateThesis = async (
  id: string,
  thesisData: ThesisData,
  transaction: Transaction
) => {
  await Thesis.update(thesisData, { where: { id }, transaction })

  const extUsers = await getAndCreateExtUsers(thesisData, transaction)

  await Supervision.destroy({ where: { thesisId: id }, transaction })
  await Supervision.bulkCreate(
    thesisData.supervisions.map((supervision) => ({
      userId:
        supervision.user?.id ??
        extUsers.find((u) => u.email === supervision.user?.email)?.id,
      thesisId: id,
      percentage: supervision.percentage,
      isPrimarySupervisor: supervision.isPrimarySupervisor,
    })),
    { transaction, validate: true, individualHooks: true }
  )

  await SeminarSupervision.destroy({ where: { thesisId: id }, transaction })
  await SeminarSupervision.bulkCreate(
    (thesisData.seminarSupervisions ?? [])
      .filter((seminarSupervision) => Boolean(seminarSupervision.user))
      .map((seminarSupervision) => ({
        userId:
          seminarSupervision.user?.id ??
          extUsers.find((u) => u.email === seminarSupervision.user?.email)?.id,
        thesisId: id,
      })),
    { transaction, validate: true, individualHooks: true }
  )

  await Grader.destroy({ where: { thesisId: id }, transaction })
  await Grader.bulkCreate(
    thesisData.graders.map((grader) => ({
      userId:
        grader.user?.id ??
        extUsers.find((u) => u.email === grader.user?.email)?.id,
      thesisId: id,
      isPrimaryGrader: grader?.isPrimaryGrader,
    })),
    { transaction, validate: true, individualHooks: true }
  )

  await Author.destroy({ where: { thesisId: id }, transaction })
  await Author.bulkCreate(
    thesisData.authors.map((author) => ({
      userId: author.id,
      thesisId: id,
    })),
    { transaction, validate: true, individualHooks: true }
  )

  await Approver.destroy({ where: { thesisId: id }, transaction })
  // We want to account for the case where approvers array is
  // sent as undefined from the client
  if (thesisData.approvers?.length) {
    await Approver.bulkCreate(
      thesisData.approvers.map((approver) => ({
        userId: approver.id,
        thesisId: id,
      })),
      { transaction, validate: true, individualHooks: true }
    )
  }
}

const deleteThesis = async (id: string, transaction: Transaction) => {
  await Thesis.destroy({ where: { id }, transaction })
}

thesisRouter.get(
  '/paginate',
  ethesisUserHandler,
  getEthesisAdminStatus,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const result = await getPaginatedTheses({
      ...req.query,
      currentUser: req.user,
      sortOrder: req.query.sortOrder as 'asc' | 'desc',
      sortBy: req.query.sortBy as string,
      departmentId: req.query.departmentId as string,
      status: req.query.status as string,
      authorsPartial: req.query.authorsPartial as string,
      topicPartial: req.query.topicPartial as string,
      programNamePartial: req.query.programNamePartial as string,
      programId: req.query.programId as string,
      language: req.query.language as string,
      onlyAuthored: req.query.onlyAuthored as string,
      onlySupervised: req.query.onlySupervised as string,
      onlySeminarSupervised: req.query.onlySeminarSupervised as string,
      limit: req.query.limit as string,
      offset: req.query.offset as string,
    })

    return res.send(result)
  }
)

thesisRouter.get(
  '/:id',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const { id } = req.params

    if (!id || typeof id !== 'string') {
      return res.status(400).send('Thesis ID is required')
    }

    const thesisData = await getSingleThesis(id, req.user, {
      onlyAuthored: false,
    })
    res.send(thesisData)
  }
)

thesisRouter.get(
  '/:id/event-log',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const { id: thesisId } = req.params

    if (!thesisId || typeof thesisId !== 'string') {
      return res.status(400).send('Thesis ID is required')
    }

    const events = await EventLog.findAll({
      include: ['user'],
      where: { thesisId },
      order: [['createdAt', 'DESC']],
    })
    return res.json(events)
  }
)

thesisRouter.post(
  '/',
  ethesisUserHandler,
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  authorizeStatusChange,
  async (req: ServerPostRequest, res: Response) => {
    const thesisData = req.body

    const createdThesis = await sequelize.transaction(async (t) => {
      const newThesis = await createThesis(thesisData, t)

      await handleAttachmentByLabel(req, newThesis.id, 'researchPlan', t)
      await handleAttachmentByLabel(req, newThesis.id, 'waysOfWorking', t)

      await EventLog.create(
        {
          thesisId: newThesis.id,
          userId: req.user.id,
          type: 'THESIS_CREATED',
        },
        { transaction: t }
      )

      await handleThesisCreationEmail(thesisData, req.user)

      return newThesis.toJSON()
    })

    res.status(201).send(createdThesis)
  }
)

thesisRouter.put(
  '/:id',
  ethesisUserHandler,
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  authorizeStatusChange,
  getEthesisAdminStatus,
  async (req: ServerPutRequest, res) => {
    const { id } = req.params
    const thesisData = req.body

    const currentUser = req.user
    if (!id) res.status(404).send(' id  not found')
    const originalThesis = await fetchThesisById(id as string, currentUser)

    if (!originalThesis) res.status(404).send('Thesis not found')

    let updatedThesis
    await sequelize.transaction(async (t) => {
      await updateThesis(id as string, thesisData, t)

      await handleAttachmentByLabel(req, id as string, 'researchPlan', t)
      await handleAttachmentByLabel(req, id as string, 'waysOfWorking', t)

      updatedThesis = await fetchThesisById(id as string, req.user, t)

      await handleStatusChangeEventLog(
        originalThesis,
        updatedThesis,
        req.user,
        t
      )
      await handleGradersChangeEventLog(
        originalThesis,
        updatedThesis,
        req.user,
        t
      )
      await handleSupervisionsChangeEventLog(
        originalThesis,
        updatedThesis,
        req.user,
        t
      )
      await handleStatusChangeEmail(originalThesis, updatedThesis, req.user)
    })

    res.send(updatedThesis)
  }
)

thesisRouter.delete(
  '/:id',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerDeleteRequest, res) => {
    const { id } = req.params

    const thesis = await fetchThesisById(id as string, req.user)

    if (!thesis) res.status(404).send('Thesis not found')

    await sequelize.transaction(async (t) => {
      await deleteThesisAttachments(id as string, t)
      await deleteThesis(id as string, t)

      await EventLog.create(
        {
          userId: req.user.id,
          type: 'THESIS_DELETED',
          data: thesis.toJSON(),
        },
        { transaction: t }
      )
    })

    res.status(204).send(`Deleted thesis with id ${id}`)
  }
)

export default thesisRouter
