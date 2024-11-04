import express from 'express'
import { EventLog } from '../db/models'

const eventLogRoute = express.Router()

// @ts-expect-error the user middleware updates the req object with user field
eventLogRoute.get('/:thesisId', async (req, res) => {
  const { thesisId } = req.params

  if (!thesisId || typeof thesisId !== 'string') {
    return res.status(400).send('Thesis ID is required')
  }

  const events = await EventLog.findAll({
    include: ['user'],
    where: { thesisId },
    order: [['createdAt', 'DESC']],
  })
  return res.json(events)
})

export default eventLogRoute
