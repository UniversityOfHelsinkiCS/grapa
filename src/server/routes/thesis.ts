import express, { Response } from 'express'
import { Includeable, type Transaction } from 'sequelize'
import { uniqBy } from 'lodash-es'
import fs from 'fs'

import {
  ServerGetRequest,
  ServerPostRequest,
  ServerPutRequest,
  ThesisData,
} from '../types'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMutlipartFormData from '../middleware/attachment'
import {
  Grader,
  Thesis,
  Supervision,
  Author,
  Attachment,
  User,
} from '../db/models'
import { sequelize } from '../db/connection'
import { validateThesisData } from '../validators/thesis'
import { getEqualSupervisorSelectionWorkloads } from '../util/helpers'

const thesisRouter = express.Router()
const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

const fetchThesisById = async (id: string) => {
  const thesis = await Thesis.findByPk(id, {
    include: [
      {
        model: Supervision,
        as: 'supervisions',
        attributes: ['percentage'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      {
        model: User,
        as: 'authors',
        attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
      },
      {
        model: Grader,
        as: 'graders',
        attributes: ['isPrimaryGrader'],
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
          },
        ],
      },
      {
        model: Attachment,
        as: 'researchPlan',
        attributes: ['filename', ['original_name', 'name'], 'mimetype'],
        where: { label: 'researchPlan' },
      },
      {
        model: Attachment,
        as: 'waysOfWorking',
        attributes: ['filename', ['original_name', 'name'], 'mimetype'],
        where: { label: 'waysOfWorking' },
      },
    ],
  })
  return thesis
}

const createThesisAndSupervisions = async (
  thesisData: ThesisData,
  t: Transaction
) => {
  const createdThesis = await Thesis.create(thesisData, { transaction: t })

  // Create the external users from the supervisions
  const extUsers = await User.bulkCreate(
    thesisData.supervisions
      .filter((supervision) => supervision.isExternal)
      .map((supervision) => ({
        username: `ext-${supervision.user?.email}`,
        firstName: supervision.user?.firstName,
        lastName: supervision.user?.lastName,
        email: supervision.user?.email,
        isExternal: true,
      })),
    {
      transaction: t,
      updateOnDuplicate: ['username'],
      validate: true,
    }
  )

  await Supervision.bulkCreate(
    thesisData.supervisions.map((supervision) => ({
      userId:
        supervision.user?.id ??
        extUsers.find((u) => u.email === supervision.user?.email)?.id,
      thesisId: createdThesis.id,
      percentage: supervision.percentage,
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

  await Grader.bulkCreate(
    thesisData.graders
      .filter((x) => Boolean(x?.user))
      .map((grader) => ({
        userId: grader?.user.id,
        thesisId: createdThesis.id,
        isPrimaryGrader: grader?.isPrimaryGrader,
      })),
    { transaction: t, validate: true, individualHooks: true }
  )
  return createdThesis
}

const handleAttachmentByLabel = async (
  req: ServerPostRequest | ServerPutRequest,
  thesisId: string,
  label: 'researchPlan' | 'waysOfWorking',
  transaction: Transaction
) => {
  const newFile = req.files[label] ? req.files[label][0] : null
  const fileMetadataFromClient = req.body[label]

  const existingAttachment = await Attachment.findOne({
    where: { thesisId, label },
    transaction,
  })

  if (!newFile && !fileMetadataFromClient) {
    // delete reserachPlan from DB and the disk
    await Attachment.destroy({
      where: { thesisId, label },
      transaction,
    })

    fs.unlinkSync(`${PATH_TO_FOLDER}${existingAttachment.filename}`)
  } else if (newFile && existingAttachment) {
    // update existing attachment
    await Attachment.update(
      {
        filename: newFile.filename,
        originalname: newFile.originalname,
        mimetype: newFile.mimetype,
      },
      {
        where: { thesisId, label },
        transaction,
      }
    )
    // delete existing files from disk
    fs.unlinkSync(`${PATH_TO_FOLDER}${existingAttachment.filename}`)
  } else if (newFile && !existingAttachment) {
    // create new attachment
    await Attachment.create(
      {
        thesisId,
        filename: newFile.filename,
        originalname: newFile.originalname,
        mimetype: newFile.mimetype,
        label,
      },
      { transaction }
    )
  }

  // NOTE: Do nothing if no new file and but fileMetadataFromClient is present.
  // This means that the file was not changed
}

const deleteThesisAttachments = async (thesisId: string, t: Transaction) => {
  const existingAttachments = await Attachment.findAll({
    where: { thesisId },
  })

  await Attachment.destroy({
    where: { thesisId },
    transaction: t,
  })

  existingAttachments.forEach((attachment) => {
    fs.unlinkSync(`${PATH_TO_FOLDER}${attachment.filename}`)
  })
}

const updateThesis = async (
  id: string,
  thesisData: ThesisData,
  transaction: Transaction
) => {
  await Thesis.update(thesisData, { where: { id }, transaction })

  // Create the external users from the supervisions
  const extUsers = await User.bulkCreate(
    thesisData.supervisions
      .filter((supervision) => supervision.isExternal)
      .map((supervision) => ({
        username: `ext-${supervision.user?.email}`,
        firstName: supervision.user?.firstName,
        lastName: supervision.user?.lastName,
        email: supervision.user?.email,
        isExternal: true,
      })),
    {
      transaction,
      updateOnDuplicate: ['username'],
      validate: true,
    }
  )

  const nonDuplicateSupervisors = uniqBy(
    thesisData.supervisions,
    (x) => x.user?.email
  )
  const updatedSupervisions = getEqualSupervisorSelectionWorkloads(
    nonDuplicateSupervisors.length,
    nonDuplicateSupervisors
  )

  await Supervision.destroy({ where: { thesisId: id }, transaction })
  await Supervision.bulkCreate(
    updatedSupervisions.map((supervision) => ({
      userId:
        supervision.user?.id ??
        extUsers.find((u) => u.email === supervision.user?.email)?.id,
      thesisId: id,
      percentage: supervision.percentage,
    })),
    { transaction, validate: true, individualHooks: true }
  )

  await Grader.destroy({ where: { thesisId: id }, transaction })
  await Grader.bulkCreate(
    thesisData.graders
      .filter((x) => Boolean(x?.user))
      .map((grader) => ({
        userId: grader?.user.id,
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
}

const deleteThesis = async (id: string, transaction: Transaction) => {
  await Thesis.destroy({ where: { id }, transaction })
}

// @ts-expect-error the user middleware updates the req object with user field
thesisRouter.get('/', async (req: ServerGetRequest, res: Response) => {
  // if a user is only a teacher, they should only see theses they supervise
  const teacherClause: Includeable = {
    model: Supervision,
    attributes: [] as const,
    where: {
      userId: req.user.id,
    },
  }
  let includes: Includeable[] = [
    {
      model: Supervision,
      as: 'supervisions',
      attributes: ['percentage'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
        },
      ],
    },
    {
      model: Grader,
      as: 'graders',
      attributes: ['isPrimaryGrader'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
        },
      ],
    },
    {
      model: User,
      as: 'authors',
      attributes: ['id', 'username', 'firstName', 'lastName', 'email'],
    },
    {
      model: Attachment,
      as: 'researchPlan',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'researchPlan' },
    },
    {
      model: Attachment,
      as: 'waysOfWorking',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'waysOfWorking' },
    },
  ]

  if (!req.user.isAdmin) {
    includes = [...includes, teacherClause]
  }

  const theses = await Thesis.findAll({
    attributes: [
      'id',
      'topic',
      'status',
      'startDate',
      'targetDate',
      'programId',
      'studyTrackId',
    ],
    include: includes,
  })
  res.send(theses)
})

thesisRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const thesis = await fetchThesisById(id)

  if (!thesis) res.status(404).send('Thesis not found')

  res.send(thesis)
})

thesisRouter.post(
  '/',
  parseMutlipartFormData,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  async (req: ServerPostRequest, res: Response) => {
    const thesisData = req.body

    const createdThesis = await sequelize.transaction(async (t) => {
      const newThesis = await createThesisAndSupervisions(thesisData, t)

      await handleAttachmentByLabel(req, newThesis.id, 'researchPlan', t)
      await handleAttachmentByLabel(req, newThesis.id, 'waysOfWorking', t)

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
  async (req: ServerPutRequest, res) => {
    const { id } = req.params
    const thesisData = req.body

    const thesis = await fetchThesisById(id)
    if (!thesis) res.status(404).send('Thesis not found')

    await sequelize.transaction(async (t) => {
      await updateThesis(id, thesisData, t)

      await handleAttachmentByLabel(req, id, 'researchPlan', t)
      await handleAttachmentByLabel(req, id, 'waysOfWorking', t)
    })

    const updatedThesis = await fetchThesisById(id)
    res.send(updatedThesis)
  }
)

thesisRouter.delete('/:id', async (req, res) => {
  const { id } = req.params

  const thesis = await fetchThesisById(id)
  if (!thesis) res.status(404).send('Thesis not found')

  await sequelize.transaction(async (t) => {
    await deleteThesisAttachments(id, t)
    await deleteThesis(id, t)
  })

  res.status(204).send(`Deleted thesis with id ${id}`)
})

export default thesisRouter
