import express, { Request, Response } from 'express'
import { Program } from '../db/models'

const programRouter = express.Router()

programRouter.get('/', async (req: Request, res: Response) => {
  const includeDisabled = req.query.includeDisabled === 'true'
  const whereClause = includeDisabled ? {} : { enabled: true }
  const programs = await Program.findAll({
    where: whereClause,
  })
  res.send(programs)
})

export default programRouter
