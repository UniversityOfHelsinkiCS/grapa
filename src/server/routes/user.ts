import express from 'express'

import { RequestWithUser } from '../types'
import { DepartmentAdmin, ProgramManagement, User } from '../db/models'

const userRouter = express.Router()

userRouter.get('/', async (req: RequestWithUser, res: any) => {
  const { user } = req

  if (!user) return res.send({})

  const managedPrograms = await ProgramManagement.findAll({
    where: { userId: user.id },
  })
  const managedProgramIds = managedPrograms.map((program) => program.programId)

  const managedDepartments = await DepartmentAdmin.findAll({
    where: { userId: user.id },
  })
  const managedDepartmentIds = managedDepartments.map(
    (department) => department.departmentId
  )

  return res.send({ ...user, managedProgramIds, managedDepartmentIds })
})

userRouter.put('/', async (req: RequestWithUser, res: any) => {
  const { user, body } = req
  const { departmentId } = body

  await User.update({ departmentId }, { where: { id: user.id } })

  return res.status(200).send({ message: 'User updated' })
})

userRouter.put('/favoritePrograms', async (req: RequestWithUser, res: any) => {
  const { user, body } = req
  const { favoriteProgramIds } = body

  await User.update({ favoriteProgramIds }, { where: { id: user.id } })

  return res.status(200).send({ message: 'User favorite programs updated' })
})

export default userRouter
