import express, { Response } from 'express'
import type { Transaction } from 'sequelize'
import fs from 'fs'

import { ServerPostRequest, ServerPutRequest, ThesisData } from '../types'
import parseFormDataJson from '../middleware/parseFormDataJson'
import parseMutlipartFormData from '../middleware/attachment'
import { Thesis, Supervision, Author, Attachment } from '../db/models'
import { sequelize } from '../db/connection'
import { validateThesisData } from '../validators/thesis'

const thesisRouter = express.Router()
const PATH_TO_FOLDER = '/opt/app-root/src/uploads/'

const fetchThesisById = async (id: string) => {
  const thesis = await Thesis.findByPk(id, {
    include: [
      {
        model: Supervision,
        as: 'supervisions',
      },
      {
        model: Author,
        as: 'authors',
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
  await Supervision.bulkCreate(
    thesisData.supervisions.map((supervision) => ({
      ...supervision,
      thesisId: createdThesis.id,
    })),
    { transaction: t, validate: true, individualHooks: true }
  )
  await Author.bulkCreate(
    thesisData.authors.map((author) => ({
      ...author,
      thesisId: createdThesis.id,
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
  await Supervision.destroy({ where: { thesisId: id }, transaction })
  await Supervision.bulkCreate(
    thesisData.supervisions.map((supervision) => ({
      ...supervision,
      thesisId: id,
    })),
    { transaction, validate: true, individualHooks: true }
  )
  await Author.destroy({ where: { thesisId: id }, transaction })
  await Author.bulkCreate(
    thesisData.authors.map((author) => ({
      ...author,
      thesisId: id,
    })),
    { transaction, validate: true, individualHooks: true }
  )
}

const deleteThesis = async (id: string, transaction: Transaction) => {
  await Thesis.destroy({ where: { id }, transaction })
}

thesisRouter.get('/', async (_, res) => {
  const theses = await Thesis.findAll({
    include: [
      {
        model: Supervision,
        as: 'supervisions',
      },
      {
        model: Author,
        as: 'authors',
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
  res.send(theses)
})

thesisRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const thesis = await fetchThesisById(id)
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

    res.send(createdThesis)
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

  await sequelize.transaction(async (t) => {
    await deleteThesisAttachments(id, t)
    await deleteThesis(id, t)
  })

  res.send(`Deleted thesis with id ${id}`)
})

export default thesisRouter
