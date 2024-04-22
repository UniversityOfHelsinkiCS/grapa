import express from 'express'

import { RequestWithUser } from '../types'

const userRouter = express.Router()

userRouter.get('/', async (req: RequestWithUser, res: any) => {
  const { user } = req

  if (!user) return res.send({})

  return res.send(user)
})

export default userRouter
