import express from 'express'

import { RequestWithUser } from '../types'
import { ProgramManagement } from '../db/models'

const userRouter = express.Router()

userRouter.get('/', async (req: RequestWithUser, res: any) => {
  const { user } = req

  if (!user) return res.send({})

  const managedPrograms = await ProgramManagement.findAll({
    where: { userId: user.id },
  })
  const managedProgramIds = managedPrograms.map((program) => program.programId)

  return res.send({ ...user, managedProgramIds })
})

export default userRouter
