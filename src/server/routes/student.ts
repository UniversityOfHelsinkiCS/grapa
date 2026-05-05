import express from 'express'

import { RequestWithUser } from '../types'
import ethesisAdminHandler from '../middleware/ethesisAdmin'
import withStudyRight from '../middleware/withStudyRight'

const studentRouter = express.Router()

studentRouter.use(withStudyRight)

// add student specific routes here. For example:

studentRouter.get(
  '/',
  ethesisAdminHandler,
  async (req: RequestWithUser, res: any) => {
    return res.send({})
  }
)

export default studentRouter
