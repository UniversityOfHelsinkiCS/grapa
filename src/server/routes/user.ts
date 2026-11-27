import express from 'express'

import type { RequestWithUser } from '../types.ts'
import {
  DepartmentAdmin,
  ProgramManagement,
  StudyTrackManagement,
  SeminarSupervision,
  User,
} from '../db/models/index.ts'
import getEthesisAdminStatus from '../middleware/getEthesisAdminStatus.ts'
import ethesisUserHandler from '../middleware/ethesisUser.ts'
import employeesAndAdminOnly from '../middleware/employeesAndAdmin.ts'
import { LoggedInUserSchema } from '../validators/userResponse.ts'

const userRouter = express.Router()

userRouter.get(
  '/',
  getEthesisAdminStatus,
  async (req: RequestWithUser, res: any) => {
    const { user } = req

    if (!user) return res.status(401).send({ error: 'Unauthorized' })

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

    const managedStudyTracks = await StudyTrackManagement.findAll({
      where: { userId: user.id },
    })
    const managedStudyTrackIds = managedStudyTracks.map((st) => st.studyTrackId)

    const thesesTableFilters = { items: [] as any[] }

    const safeData = LoggedInUserSchema.parse({
      ...user,
      managedProgramIds,
      managedStudyTrackIds,
      managedDepartmentIds,
      approvableProgramIds,
      hasSeminarSupervisions,
      thesesTableFilters,
    })

    return res.send(safeData)
  }
)

// These routes should be only available to admins and employees
userRouter.use(employeesAndAdminOnly)

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

export default userRouter
