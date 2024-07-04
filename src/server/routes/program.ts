import express, { Response } from 'express'
import { Program, ProgramManagement, StudyTrack } from '../db/models'
import { RequestWithUser } from '../types'

const programRouter = express.Router()

// @ts-expect-error the user middleware updates the req object with user field
programRouter.get('/', async (req: RequestWithUser, res: Response) => {
  const includeDisabled = req.query.includeDisabled === 'true'
  const includeNotManaged = req.query.includeNotManaged === 'true'

  const { isAdmin } = req.user

  const whereClause = includeDisabled ? {} : { enabled: true }
  const includes = [
    {
      model: StudyTrack,
      attributes: ['id', 'name', 'programId'],
      as: 'studyTracks',
    },
  ]
  if (!isAdmin && !includeNotManaged) {
    includes.push({
      model: ProgramManagement,
      attributes: [],
      where: { userId: req.user.id },
      required: true,
    })
  }

  const programs = await Program.findAll({
    attributes: ['id', 'name'],
    where: whereClause,
    include: includes,
  })
  res.send(programs)
})

export default programRouter
