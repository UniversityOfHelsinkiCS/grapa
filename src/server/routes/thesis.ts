import express from 'express'
import { ThesisData } from '@backend/types'
import Thesis from '../db/models/Thesis'

const thesisRouter = express.Router()

const fetchThesisById = async (id: string) => {
  const thesis = await Thesis.findByPk(id)
  return thesis
}

const createThesis = async (thesisData: ThesisData) => {
  const newThesis = await Thesis.create(thesisData)
  return newThesis
}

const updateThesis = async (id: string, thesisData: ThesisData) => {
  await Thesis.update(thesisData, { where: { id } })
}

const deleteThesis = async (id: string) => {
  await Thesis.destroy({ where: { id } })
}

thesisRouter.get('/', async (_, res) => {
  const theses = await Thesis.findAll()
  res.send(theses)
})

thesisRouter.get('/:id', async (req, res) => {
  const { id } = req.params
  const thesis = await fetchThesisById(id)
  res.send(thesis)
})

thesisRouter.post('/', async (req, res) => {
  const thesisData = req.body
  const newThesis = await createThesis(thesisData)
  res.send(newThesis)
})

thesisRouter.put('/:id', async (req, res) => {
  const { id } = req.params
  const thesisData = req.body
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
