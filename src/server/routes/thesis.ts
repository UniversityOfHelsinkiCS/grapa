import express from 'express'
import { ThesisData } from '@backend/types'
import { Thesis, Supervision, Author } from '../db/models'
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

const createThesisAndSupervisions = async (thesisData: ThesisData) => {
  const newThesis = sequelize.transaction(async (t) => {
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
  })

  return newThesis
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
    ],
  })
  res.send(theses)
})

thesisRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const thesis = await fetchThesisById(id)
  res.send(thesis)
})

thesisRouter.post('/', async (req, res) => {
  const thesisData = req.body

  validateThesisData(thesisData)

  const newThesis = await createThesisAndSupervisions(thesisData)
  res.send(newThesis)
})

thesisRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const thesisData = req.body

  validateThesisData(thesisData)

  await updateThesis(id, thesisData)
  const updatedThesis = await fetchThesisById(id)
  res.send(updatedThesis)
})

thesisRouter.delete('/:id', async (req, res) => {
  const { id } = req.params
  await deleteThesis(id)
  res.send(`Deleted thesis with id ${id}`)
})

export default thesisRouter
