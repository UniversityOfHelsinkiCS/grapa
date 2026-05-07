import express from 'express'

import { RequestWithUser } from '../types'
import withStudyRight from '../middleware/withStudyRight'

const studentRouter = express.Router()

studentRouter.use(withStudyRight)

// add student specific routes here. For example:

studentRouter.get('/', async (req: RequestWithUser, res: any) => {
  return res.send({})
})

export default studentRouter
