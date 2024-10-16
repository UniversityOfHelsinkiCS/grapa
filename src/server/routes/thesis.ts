import express, { Response } from 'express'
import { type Transaction } from 'sequelize'

import {
  ServerDeleteRequest,
  ServerGetRequest,
  ServerPostRequest,
  ServerPutRequest,
  ThesisData,
  User as UserType,
} from '../types'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMutlipartFormData from '../middleware/attachment'
import {
  Grader,
  Thesis,
  Supervision,
  Author,
  Approver,
  User,
  EventLog,
} from '../db/models'
import { sequelize } from '../db/connection'
import { validateThesisData } from '../validators/thesis'
import { transformSingleThesis, transformThesisData } from '../util/helpers'
import { authorizeStatusChange } from '../middleware/authorizeStatusChange'
import {
  getAndCreateExtUsers,
  getFindThesesOptions,
  handleGradersChangeEventLog,
  handleStatusChangeEventLog,
  handleSupervisionsChangeEventLog,
} from './thesisHelpers'
import {
  deleteThesisAttachments,
  handleAttachmentByLabel,
} from './thesisAttachmentHelpers'

const thesisRouter = express.Router()

const fetchThesisById = async (id: string, user: UserType) => {
  const options = await getFindThesesOptions({ thesisId: id, actionUser: user })
  // We need to use findAll here because we need to include
  // Supervision model twice (see the explanation twice above).
  // For some reason. findOne does not support that
  const theses = await Thesis.findAll({ ...options })
  const thesis = theses.find((t) => t.id === id)

  return thesis
}

const createThesis = async (thesisData: ThesisData, t: Transaction) => {
  const createdThesis = await Thesis.create(thesisData, { transaction: t })

  const extUsers = await getAndCreateExtUsers(thesisData, t)

  await Supervision.bulkCreate(
    thesisData.supervisions.map((supervision) => ({
      userId:
        supervision.user?.id ??
        extUsers.find((u) => u.email === supervision.user?.email)?.id,
      thesisId: createdThesis.id,
      percentage: supervision.percentage,
      isPrimarySupervisor: supervision.isPrimarySupervisor,
    })),
    { transaction: t, validate: true, individualHooks: true }
  )

  await Author.bulkCreate(
    thesisData.authors.map((author) => ({
      userId: author.id,
      thesisId: createdThesis.id,
    })),
    { transaction: t, validate: true, individualHooks: true }
  )

  // We want to account for the case where approvers array is
  // sent as undefined from the client
  if (thesisData.approvers?.length) {
    await Approver.bulkCreate(
      thesisData.approvers.map((approver) => ({
        userId: approver.id,
        thesisId: createdThesis.id,
      })),
      { transaction: t, validate: true, individualHooks: true }
    )
  }

  // Create the external users from the graders
  await User.bulkCreate(
    thesisData.graders
      .filter((grader) => grader.isExternal)
      .map((grader) => ({
        username: `ext-${grader.user?.email}`,
        firstName: grader.user?.firstName,
        lastName: grader.user?.lastName,
        email: grader.user?.email,
        isExternal: true,
      })),
    {
      transaction: t,
      updateOnDuplicate: ['username'],
      validate: true,
    }
  )

  await Grader.bulkCreate(
    thesisData.graders
      .filter((x) => Boolean(x?.user))
      .map((grader) => ({
        userId:
          grader.user?.id ??
          extUsers.find((u) => u.email === grader.user?.email)?.id,
        thesisId: createdThesis.id,
        isPrimaryGrader: grader?.isPrimaryGrader,
      })),
    { transaction: t, validate: true, individualHooks: true }
  )
  return createdThesis
}

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

// @ts-expect-error the user middleware updates the req object with user field
thesisRouter.get('/paginate', async (req: ServerGetRequest, res: Response) => {
  const { onlySupervised, limit = 50, offset = 0 } = req.query

  const options = await getFindThesesOptions({
    actionUser: req.user,
    onlySupervised: onlySupervised === 'true',
  })

  const { count, rows } = await Thesis.findAndCountAll({
    ...options,
    subQuery: false,
    offset: Number(offset),
    limit: Number(limit),
    order: [['targetDate', 'ASC']],
    distinct: true,
  })

  const thesesRows = rows.map((t) => t.toJSON()) as ThesisData[]
  const theses = transformThesisData(thesesRows)

  res.send({ theses, totalCount: count })
})

// @ts-expect-error the user middleware updates the req object with user field
thesisRouter.get('/:id', async (req: ServerGetRequest, res: Response) => {
  const { id } = req.params
  const thesis = await fetchThesisById(id, req.user)

  if (!thesis) res.status(404).send('Thesis not found')

  const thesisData = transformSingleThesis(thesis.toJSON() as ThesisData)

  res.send(thesisData)
})

thesisRouter.post(
  '/',
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

      return newThesis.toJSON()
    })

    res.status(201).send(createdThesis)
  }
)

thesisRouter.put(
  '/:id',
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  authorizeStatusChange,
  async (req: ServerPutRequest, res) => {
    const { id } = req.params
    const thesisData = req.body

    const originalThesis = await fetchThesisById(id, req.user)

    if (!originalThesis) res.status(404).send('Thesis not found')

    await sequelize.transaction(async (t) => {
      await updateThesis(id, thesisData, t)

      await handleAttachmentByLabel(req, id, 'researchPlan', t)
      await handleAttachmentByLabel(req, id, 'waysOfWorking', t)

      await handleStatusChangeEventLog(originalThesis, thesisData, req.user, t)
      await handleGradersChangeEventLog(originalThesis, thesisData, req.user, t)
      await handleSupervisionsChangeEventLog(
        originalThesis,
        thesisData,
        req.user,
        t
      )
    })

    const updatedThesis = await fetchThesisById(id, req.user)
    res.send(updatedThesis)
  }
)

// @ts-expect-error the user middleware updates the req object with user field
thesisRouter.delete('/:id', async (req: ServerDeleteRequest, res) => {
  const { id } = req.params

  const thesis = await fetchThesisById(id, req.user)
  if (!thesis) res.status(404).send('Thesis not found')

  await sequelize.transaction(async (t) => {
    await deleteThesisAttachments(id, t)
    await deleteThesis(id, t)

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
})

export default thesisRouter
