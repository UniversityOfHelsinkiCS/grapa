import express, { Response } from 'express'
import { Includeable, Op, type Transaction } from 'sequelize'
import { uniqBy } from 'lodash-es'
import fs from 'fs'

import {
  GraderData,
  ServerDeleteRequest,
  ServerGetRequest,
  ServerPostRequest,
  ServerPutRequest,
  SupervisionData,
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
  Attachment,
  User,
  ProgramManagement,
} from '../db/models'
import { sequelize } from '../db/connection'
import { validateThesisData } from '../validators/thesis'
import {
  getEqualSupervisorSelectionWorkloads,
  transformThesisData,
} from '../util/helpers'
import { authorizeStatusChange } from '../middleware/authorizeStatusChange'
import { userFields } from './config'

const thesisRouter = express.Router()
const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

interface FetchThesisProps {
  thesisId?: string
  actionUser: UserType
}
const getFindThesesOptions = async ({
  thesisId,
  actionUser,
}: FetchThesisProps) => {
  let includes: Includeable[] = [
    {
      model: Supervision,
      as: 'supervisions',
      attributes: ['percentage'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: userFields,
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
          attributes: userFields,
        },
      ],
    },
    {
      model: User,
      as: 'authors',
      attributes: userFields,
    },
    {
      model: Attachment,
      as: 'researchPlan',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'researchPlan' },
      required: false,
    },
    {
      model: Attachment,
      as: 'waysOfWorking',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'waysOfWorking' },
      required: false,
    },
  ]

  let whereClause: Record<any, any> = thesisId ? { id: thesisId } : {}
  if (!actionUser.isAdmin) {
    const programManagement = await ProgramManagement.findAll({
      attributes: ['programId'],
      where: { userId: actionUser.id },
    })

    // We want to include theses where current user is a supervisor
    // but for the returned theses, we still want to include all
    // supervisions.
    // To achieve this, we use 2 Supervision includes, one above
    // with attribute listed and one below with no attributes.
    // The only purpose of this include is to be used in filtering.
    const teacherClause: Includeable = {
      model: Supervision,
      as: 'supervisionsForFiltering',
      attributes: [] as const,
    }
    includes = [...includes, teacherClause]

    const programIds = programManagement.map((pm) => pm.programId)
    whereClause = {
      [Op.or]: [
        // if a user is only a teacher, they should only see
        // theses they supervise
        { '$supervisionsForFiltering.user_id$': actionUser.id },
        // but we also want to show all theses within programs
        // managed by the user
        programIds?.length ? { programId: programIds } : {},
      ],
    }
  }

  return {
    where: whereClause,
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
  }
}

const getAndCreateExtUsers = async (
  thesisData: ThesisData,
  transaction: Transaction
) => {
  const gradersAndSupervisors = [
    ...thesisData.supervisions,
    ...thesisData.graders,
  ]
  // Create the external users from the graders and supervisions
  const extUsers = await User.bulkCreate(
    gradersAndSupervisors
      .filter((person) => person.isExternal)
      .map((person) => ({
        username: `ext-${person.user?.email}`,
        firstName: person.user?.firstName,
        lastName: person.user?.lastName,
        email: person.user?.email,
        isExternal: true,
      })),
    {
      transaction,
      updateOnDuplicate: ['username'],
      validate: true,
    }
  )

  return extUsers
}

const fetchThesisById = async (id: string, user: UserType) => {
  const options = await getFindThesesOptions({ thesisId: id, actionUser: user })
  // We need to use findAll here because we need to include
  // Supervision model twice (see the explanation twice above).
  // For some reason. findOne does not support that
  const thesis = await Thesis.findAll({ ...options })
  return thesis[0]
}

const createThesisAndSupervisions = async (
  thesisData: ThesisData,
  t: Transaction
) => {
  const createdThesis = await Thesis.create(thesisData, { transaction: t })

  const extUsers = await getAndCreateExtUsers(thesisData, t)

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

  const extUsers = await getAndCreateExtUsers(thesisData, transaction)

  const nonDuplicateSupervisors = uniqBy(
    thesisData.supervisions,
    (x: SupervisionData) => x.user?.email
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

  const nonDuplicateGraders = uniqBy(
    thesisData.graders.filter((x) => Boolean(x?.user)),
    (x: GraderData) => x.user?.email
  ) as unknown as GraderData[]

  await Grader.destroy({ where: { thesisId: id }, transaction })
  await Grader.bulkCreate(
    nonDuplicateGraders.map((grader) => ({
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
}

const deleteThesis = async (id: string, transaction: Transaction) => {
  await Thesis.destroy({ where: { id }, transaction })
}

// @ts-expect-error the user middleware updates the req object with user field
thesisRouter.get('/', async (req: ServerGetRequest, res: Response) => {
  const options = await getFindThesesOptions({ actionUser: req.user })
  const theses = await Thesis.findAll({
    ...options,
    order: [['targetDate', 'ASC']],
  })

  const thesisData = transformThesisData(JSON.parse(JSON.stringify(theses)))

  res.send(thesisData)
})

// @ts-expect-error the user middleware updates the req object with user field
thesisRouter.get('/:id', async (req: ServerGetRequest, res: Response) => {
  const { id } = req.params
  const thesis = await fetchThesisById(id, req.user)

  if (!thesis) res.status(404).send('Thesis not found')

  const thesisData = transformThesisData(JSON.parse(JSON.stringify(thesis)))
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
  authorizeStatusChange,
  async (req: ServerPutRequest, res) => {
    const { id } = req.params
    const thesisData = req.body

    const thesis = await fetchThesisById(id, req.user)

    if (!thesis) res.status(404).send('Thesis not found')

    await sequelize.transaction(async (t) => {
      await updateThesis(id, thesisData, t)

      await handleAttachmentByLabel(req, id, 'researchPlan', t)
      await handleAttachmentByLabel(req, id, 'waysOfWorking', t)
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
  })

  res.status(204).send(`Deleted thesis with id ${id}`)
})

export default thesisRouter
