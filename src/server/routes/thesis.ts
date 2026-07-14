import express, { Response } from 'express'
import { type Transaction } from 'sequelize'

import {
  ServerDeleteRequest,
  ServerGetRequest,
  ServerPostRequest,
  ServerPutRequest,
} from '../types'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMultipartFormData from '../middleware/attachment'
import { Thesis, EventLog, Program } from '../db/models'
import { sequelize } from '../db/connection'
import { validateThesisDataMiddleware } from '../validators/thesis'
import { getPrimaryStudyTrackId } from '../util/studyTracks'

import { getPaginatedTheses, createThesis } from '../services/thesisService'
import { authorizeStatusChange } from '../middleware/authorizeStatusChange'
import {
  handleGradersChangeEventLog,
  handleStatusChangeEventLog,
  handleSupervisionsChangeEventLog,
  thesesToCsv,
} from '../services/thesisHelpers'

import {
  handleStatusChangeEmail,
  handleThesisCreationEmail,
} from '../services/thesisNotificationService'
import {
  deleteThesisAttachments,
  handleAttachmentByLabel,
} from './thesisAttachmentHelpers'
import getEthesisAdminStatus from '../middleware/getEthesisAdminStatus'
import ethesisUserHandler from '../middleware/ethesisUser'
import { fetchThesisById, getSingleThesis } from '../services/thesisService'
import { updateThesis } from '../services/thesisService'

const thesisRouter = express.Router()

const deleteThesis = async (id: string, transaction: Transaction) => {
  await Thesis.destroy({ where: { id }, transaction })
}

const getPaginatedQuery = (req: ServerGetRequest) => ({
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
  studyTrackId: req.query.studyTrackId as string,
  language: req.query.language as string,
  onlyAuthored: req.query.onlyAuthored as string,
  onlySupervised: req.query.onlySupervised as string,
  onlySeminarSupervised: req.query.onlySeminarSupervised as string,
  limit: req.query.limit as string,
  offset: req.query.offset as string,
  search: req.query.search as string,
  milestone: req.query.milestone as string,
  missingSecondGrader: req.query.missingSecondGrader === 'true',
  lastMilestone: req.query.lastMilestone === 'true',
  ethesisReadyStudentStarted: req.query.ethesisReadyStudentStarted === 'true',
  hideStudentStartedEthesis: req.query.hideStudentStartedEthesis === 'true',
})

thesisRouter.get(
  '/paginate',
  ethesisUserHandler,
  getEthesisAdminStatus,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const result = await getPaginatedTheses(getPaginatedQuery(req))
    return res.send(result)
  }
)

thesisRouter.get(
  '/csv',
  ethesisUserHandler,
  getEthesisAdminStatus,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: ServerGetRequest, res: Response) => {
    const query = getPaginatedQuery(req)
    query.limit = 'all'
    const result = await getPaginatedTheses(query)

    const language = (req.query.language as string) || 'fi'
    const csvString = thesesToCsv(result.theses, language)

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', 'attachment; filename="theses.csv"')
    return res.send(csvString)
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
      onlySeminarSupervised: req.query.onlySeminarSupervised === 'true',
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
  parseMultipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisDataMiddleware,
  authorizeStatusChange,
  async (req: ServerPostRequest, res: Response) => {
    const thesisData = req.body

    if (thesisData.studyTrackId && thesisData.programId) {
      const program = await Program.findByPk(thesisData.programId)
      const options = (program as any)?.options
      thesisData.studyTrackId =
        getPrimaryStudyTrackId(options, thesisData.studyTrackId) || undefined
    }

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
  parseMultipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisDataMiddleware,
  authorizeStatusChange,
  getEthesisAdminStatus,
  async (req: ServerPutRequest, res) => {
    const { id } = req.params
    const thesisData = req.body

    if (thesisData.studyTrackId && thesisData.programId) {
      const program = await Program.findByPk(thesisData.programId)
      const options = (program as any)?.options
      thesisData.studyTrackId =
        getPrimaryStudyTrackId(options, thesisData.studyTrackId) || undefined
    }

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
