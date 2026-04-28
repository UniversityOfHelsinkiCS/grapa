import express from 'express'

import { RequestWithUser } from '../types'
import { validateUserThesesTableFiltersData } from '../validators/user'
import {
  DepartmentAdmin,
  ProgramManagement,
  SeminarSupervision,
  User,
} from '../db/models'
import ethesisAdminHandler from '../middleware/ethesisAdmin'
import ethesisUserHandler from '../middleware/ethesisUser'

const userRouter = express.Router()

userRouter.get(
  '/',
  ethesisAdminHandler,
  async (req: RequestWithUser, res: any) => {
    const { user } = req

    if (!user) return res.send({})

    const managedPrograms = await ProgramManagement.findAll({
      where: { userId: user.id },
    })
    const managedProgramIds = managedPrograms.map(
      (program) => program.programId
    )
    const approvableProgramIds = managedPrograms
      .filter((program) => program.isThesisApprover)
      .map((program) => program.programId)

    const managedDepartments = await DepartmentAdmin.findAll({
      where: { userId: user.id },
    })
    const managedDepartmentIds = managedDepartments.map(
      (department) => department.departmentId
    )
    const hasSeminarSupervisions = Boolean(
      await SeminarSupervision.count({ where: { userId: user.id } })
    )

    return res.send({
      ...user,
      managedProgramIds,
      managedDepartmentIds,
      approvableProgramIds,
      hasSeminarSupervisions,
    })
  }
)

userRouter.put(
  '/',
  ethesisUserHandler,
  async (req: RequestWithUser, res: any) => {
    const { user, body } = req
    const { departmentId } = body

    await User.update({ departmentId }, { where: { id: user.id } })

    return res.status(200).send({ message: 'User updated' })
  }
)

userRouter.put(
  '/favorite-programs',
  ethesisUserHandler,
  async (req: RequestWithUser, res: any) => {
    const { user, body } = req
    const { favoriteProgramIds } = body

    await User.update({ favoriteProgramIds }, { where: { id: user.id } })

    return res.status(200).send({ message: 'User favorite programs updated' })
  }
)

userRouter.put(
  '/theses-table-filters',
  // @ts-expect-error the user middleware updates the req object with user field
  validateUserThesesTableFiltersData,
  ethesisUserHandler,
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
