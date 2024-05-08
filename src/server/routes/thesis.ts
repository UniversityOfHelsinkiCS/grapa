import express, { Response } from 'express'
import type { Transaction } from 'sequelize'

import { RequestWithThesisData, ThesisData } from '../types'
import parseFormDataJson from '../middleware/parseFormDataJson'
import attachment from '../middleware/attachment'
import { Thesis, Supervision, Author, Attachment } from '../db/models'
import { sequelize } from '../db/connection'
import { validateThesisData } from '../validators/thesis'

const thesisRouter = express.Router()

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

interface CreateThesisAndSupervisionsProps {
  researchPlanFile: Express.Multer.File
  waysOfWorkingFile: Express.Multer.File
  thesisId: string
  t: Transaction
}
const createThesisAttachments = async ({
  thesisId,
  researchPlanFile,
  waysOfWorkingFile,
  t,
}: CreateThesisAndSupervisionsProps) => {
  // save research plan and ways of working attachments
  await Attachment.create(
    {
      thesisId,
      fileName: researchPlanFile.filename,
      originalName: researchPlanFile.originalname,
      mimeType: researchPlanFile.mimetype,
      label: 'researchPlan',
    },
    { transaction: t }
  )
  await Attachment.create(
    {
      thesisId,
      fileName: waysOfWorkingFile.filename,
      originalName: waysOfWorkingFile.originalname,
      mimeType: waysOfWorkingFile.mimetype,
      label: 'waysOfWorking',
    },
    { transaction: t }
  )
}

const updateThesis = async (id: string, thesisData: ThesisData) => {
  // update Thesis and its supervisions in a transaction
  await sequelize.transaction(async (t) => {
    await Thesis.update(thesisData, { where: { id }, transaction: t })
    await Supervision.destroy({ where: { thesisId: id }, transaction: t })
    await Supervision.bulkCreate(
      thesisData.supervisions.map((supervision) => ({
        ...supervision,
        thesisId: id,
      })),
      { transaction: t, validate: true, individualHooks: true }
    )
    await Author.destroy({ where: { thesisId: id }, transaction: t })
    await Author.bulkCreate(
      thesisData.authors.map((author) => ({
        ...author,
        thesisId: id,
      })),
      { transaction: t, validate: true, individualHooks: true }
    )
  })
}

const deleteThesis = async (id: string) => {
  await Thesis.destroy({ where: { id } })
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
        attributes: ['fileName', ['original_name', 'name'], 'mimeType'],
      },
      {
        model: Attachment,
        as: 'waysOfWorking',
        attributes: ['fileName', ['original_name', 'name'], 'mimeType'],
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
  attachment,
  parseFormDataJson,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  async (req: RequestWithThesisData, res: Response) => {
    const thesisData = req.body

    const createdThesis = await sequelize.transaction(async (t) => {
      const newThesis = await createThesisAndSupervisions(thesisData, t)

      const researchPlanFile = req.files.researchPlan[0]
      const waysOfWorkingFile = req.files.waysOfWorking[0]

      await createThesisAttachments({
        researchPlanFile,
        waysOfWorkingFile,
        thesisId: newThesis.id,
        t,
      })

      return { ...newThesis.toJSON(), researchPlanFile, waysOfWorkingFile }
    })

    res.send(createdThesis)
  }
)

thesisRouter.put(
  '/:id',
  attachment,
  // @ts-expect-error the middleware updates the req object with the parsed JSON
  validateThesisData,
  async (req, res) => {
    const { id } = req.params
    const thesisData = req.body

    await updateThesis(id, thesisData)
    const updatedThesis = await fetchThesisById(id)
    res.send(updatedThesis)
  }
)

thesisRouter.delete('/:id', async (req, res) => {
  const { id } = req.params
  await deleteThesis(id)
  res.send(`Deleted thesis with id ${id}`)
})

export default thesisRouter
