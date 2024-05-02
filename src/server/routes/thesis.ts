import express from 'express'
import { ThesisData } from '@backend/types'
import { Thesis, Supervision } from '@backend/db/models'
import { sequelize } from '@backend/db/connection'

const validateThesisData = (thesisData: ThesisData) => {
  if (!thesisData.topic) {
    throw new Error('Thesis title is required')
  }

  if (!thesisData.supervisions || thesisData.supervisions.length === 0) {
    throw new Error('At least one supervision is required')
  }

  if (!thesisData.supervisions || thesisData.supervisions.length === 0) {
    throw new Error('At least one supervision is required')
  }

  // sum of supervision percentages must add up to 100
  const totalPercentage = thesisData.supervisions.reduce(
    (total, supervision) => total + supervision.percentage,
    0
  )
  if (totalPercentage !== 100) {
    throw new Error('Supervision percentages must add up to 100')
  }
}

const thesisRouter = express.Router()

const fetchThesisById = async (id: string) => {
  const thesis = await Thesis.findByPk(id)
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
      { transaction: t }
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
      { transaction: t }
    )
  })
}

const deleteThesis = async (id: string) => {
  await Thesis.destroy({ where: { id } })
}

thesisRouter.get('/', async (_, res) => {
  const theses = await Thesis.findAll({
    include: {
      model: Supervision,
      as: 'supervisions',
    },
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
