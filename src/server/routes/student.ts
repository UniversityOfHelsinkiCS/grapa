import express from 'express'

import { RequestWithUser } from '../types'
import withStudyRight from '../middleware/withStudyRight'

import { getPaginatedTheses } from '../services/thesisService'

import { getUsersBySearch } from '../services/userService'

const studentRouter = express.Router()

studentRouter.use(withStudyRight)

studentRouter.get('/theses', async (req: RequestWithUser, res: any) => {
  const result = await getPaginatedTheses({
    ...req.query,
    currentUser: req.user,
    onlyAuthored: true,
    sortOrder: req.query.sortOrder as 'asc' | 'desc',
    sortBy: req.query.sortBy as string,
    departmentId: req.query.departmentId as string,
    status: req.query.status as string,
    authorsPartial: req.query.authorsPartial as string,
    topicPartial: req.query.topicPartial as string,
    programNamePartial: req.query.programNamePartial as string,
    programId: req.query.programId as string,
    language: req.query.language as string,
    limit: req.query.limit as string,
    offset: req.query.offset as string,
  })

  return res.send(result)
})

studentRouter.get('/users', async (req: RequestWithUser, res: any) => {
  const { search } = req.query
  const result = await getUsersBySearch(search as string)
  res.send(result)
})

export default studentRouter
