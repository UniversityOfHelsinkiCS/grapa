import express from 'express'
import { ServerPostRequest } from '../types'
import { sequelize } from '../db/connection'

import { EventLog } from '../db/models'

import { RequestWithUser } from '../types'
import withStudyRight from '../middleware/withStudyRight'

import {
  getPaginatedTheses,
  createThesis,
  getSingleThesis,
} from '../services/thesisService'

import { getUsersBySearch } from '../services/userService'

import ethesisUserHandler from '../middleware/ethesisUser'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMutlipartFormData from '../middleware/attachment'
import { authorizeStatusChange } from '../middleware/authorizeStatusChange'
import { validateThesisData } from '../validators/thesis'

import { handleAttachmentByLabel } from './thesisAttachmentHelpers'
import { handleThesisCreationEmail } from './thesisHelpers'

const studentRouter = express.Router()

studentRouter.use(withStudyRight)

studentRouter.get('/theses', async (req: RequestWithUser, res: any) => {
  const result = await getPaginatedTheses({
    ...req.query,
    currentUser: req.user,
    onlyAuthored: true,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
    sortBy: req.query.sortBy as string,
    departmentId: req.query.departmentId as string,
    status: req.query.status as string,
    authorsPartial: req.query.authorsPartial as string,
    topicPartial: req.query.topicPartial as string,
    programNamePartial: req.query.programNamePartial as string,
    programId: req.query.programId as string,
    language: req.query.language as string,
    limit: req.query.limit as string,
    offset: req.query.offset as string,
  })

  return res.send(result)
})

studentRouter.get('/theses/:id', async (req: RequestWithUser, res: any) => {
  const { id } = req.params

  if (!id || typeof id !== 'string') {
    return res.status(400).send('Thesis ID is required')
  }

  const thesisData = await getSingleThesis(id, req.user, { onlyAuthored: true })
  res.send(thesisData)
})

studentRouter.get('/users', async (req: RequestWithUser, res: any) => {
  const { search } = req.query
  const result = await getUsersBySearch(search as string)
  res.send(result)
})

studentRouter.post(
  '/',
  ethesisUserHandler,
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  authorizeStatusChange,
  async (req: ServerPostRequest, res: any) => {
    const thesisData = req.body

    // Restrict students from creating theses with other statuses than SUGGESTED
    if (thesisData.status != 'SUGGESTED') {
      res
        .status(400)
        .send(
          "Student's cannot create theses with other statuses than SUGGESTED"
        )
      return
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

export default studentRouter
