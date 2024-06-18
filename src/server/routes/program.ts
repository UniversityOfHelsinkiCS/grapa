import express, { Request, Response } from 'express'
import { Program, StudyTrack } from '../db/models'

const programRouter = express.Router()

programRouter.get('/', async (req: Request, res: Response) => {
  const includeDisabled = req.query.includeDisabled === 'true'
  const whereClause = includeDisabled ? {} : { enabled: true }
  const programs = await Program.findAll({
    attributes: ['id', 'name'],
    where: whereClause,
    include: {
      model: StudyTrack,
      attributes: ['id', 'name', 'programId'],
      as: 'studyTracks',
    },
  })
  res.send(programs)
})

export default programRouter
