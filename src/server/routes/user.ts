import express from 'express'

import { RequestWithUser } from '../types'
import { validateUserThesesTableFiltersData } from '../validators/user'
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

userRouter.put('/favorite-programs', async (req: RequestWithUser, res: any) => {
  const { user, body } = req
  const { favoriteProgramIds } = body

  await User.update({ favoriteProgramIds }, { where: { id: user.id } })

  return res.status(200).send({ message: 'User favorite programs updated' })
})

userRouter.put(
  '/theses-table-filters',
  // @ts-expect-error the user middleware updates the req object with user field
  validateUserThesesTableFiltersData,
  async (req: RequestWithUser, res: any) => {
    const { user, body } = req
    const { thesesTableFilters } = body

    await User.update({ thesesTableFilters }, { where: { id: user.id } })

    return res
      .status(200)
      .send({ message: 'User thesis table filters updated' })
  }
)

export default userRouter
