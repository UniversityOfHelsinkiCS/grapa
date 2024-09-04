import express, { Response } from 'express'
import { literal, Op } from 'sequelize'

import {
  Department,
  DepartmentAdmin,
  Supervision,
  Thesis,
  User,
} from '../db/models'
import { RequestWithUser, ThesisStatistics } from '../types'

const departmentAdminRouter = express.Router()

departmentAdminRouter.get(
  '/',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user

    const departments = await DepartmentAdmin.findAll({
      attributes: ['id', 'departmentId', 'userId'],
      where: isAdmin
        ? {}
        : {
            departmentId: {
              [Op.in]: literal(
                `(SELECT department_id FROM department_admins WHERE user_id = $editorUserId)`
              ),
            },
          },
      include: [
        {
          model: User,
          as: 'user',
        },
        {
          model: Department,
          as: 'department',
        },
      ],
      order: [['departmentId', 'ASC']],
      bind: { editorUserId: req.user.id },
    })

    res.send(departments)
  }
)

departmentAdminRouter.get(
  '/statistics',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { id: userId, isAdmin } = req.user

    const managedDepartments = await DepartmentAdmin.findAll({
      where: { userId },
    })
    const managedDepartmentIds = managedDepartments.map(
      (department) => department.departmentId
    )

    if (!isAdmin && managedDepartmentIds.length === 0) {
      res.status(403).send({
        error:
          'Forbidden, only department admins can view department statistics',
      })
      return
    }

    const departmentSupervisions = (await Supervision.findAll({
      attributes: [
        'id',
        'thesisId',
        'userId',
        'percentage',
        'isPrimarySupervisor',
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'id',
            'username',
            'firstName',
            'lastName',
            'email',
            'departmentId',
          ],
          where: {
            departmentId: {
              [Op.in]: managedDepartmentIds,
            },
            isExternal: false,
          },
        },
        {
          model: Thesis,
          as: 'thesis',
        },
      ],
    })) as unknown as {
      id: string
      thesisId: string
      userId: string
      percentage: number
      isPrimarySupervisor: boolean
      user: User
      thesis: Thesis
    }[]

    const statistics: ThesisStatistics[] = []

    departmentSupervisions.forEach((supervision) => {
      const { user, thesis } = supervision
      const { status } = thesis

      const supervisor = statistics.find((s) => s.supervisor.id === user.id)
      if (supervisor) {
        supervisor.statusCounts[status] =
          (supervisor.statusCounts[status] || 0) + 1
      } else {
        statistics.push({
          supervisor: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            departmentId: user.departmentId,
          },
          statusCounts: {
            PLANNING: status === 'PLANNING' ? 1 : 0,
            IN_PROGRESS: status === 'IN_PROGRESS' ? 1 : 0,
            COMPLETED: status === 'COMPLETED' ? 1 : 0,
            CANCELLED: status === 'CANCELLED' ? 1 : 0,
          },
        })
      }
    })

    res.status(200).send(statistics)
  }
)

departmentAdminRouter.post(
  '/',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { user: editorUser } = req
    const { departmentId, userId: targetUserId } = req.body
    const { isAdmin } = req.user

    if (!isAdmin) {
      const userHasAccessToDepartment = await DepartmentAdmin.findOne({
        attributes: ['departmentId'],
        where: {
          userId: editorUser.id,
          departmentId,
        },
      })

      if (!userHasAccessToDepartment) {
        res.status(403).send({
          error:
            'Forbidden, only department admins can create new department admins',
        })
        return
      }
    }

    const departmentAdmin = await DepartmentAdmin.create({
      departmentId,
      userId: targetUserId,
    })

    res.status(201).send(departmentAdmin)
  }
)

departmentAdminRouter.delete(
  '/:id',
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { user: editorUser } = req
    const { isAdmin } = editorUser

    let whereClause: any = { id: req.params.id }

    if (!isAdmin) {
      // if not admin, check if user has access to the department
      const departmentsUserHasAccessTo = await DepartmentAdmin.findAll({
        attributes: ['departmentId'],
        where: {
          userId: editorUser.id,
        },
      })

      if (departmentsUserHasAccessTo.length === 0) {
        res.status(403).send({
          error:
            'Forbidden, only departmend admins can remove other department admins',
        })
        return
      }

      whereClause = {
        ...whereClause,
        departmentId: {
          [Op.in]: departmentsUserHasAccessTo.map((d) => d.departmentId),
        },
      }
    }

    const departmentAdmin = await DepartmentAdmin.findOne({
      where: whereClause,
    })

    if (!departmentAdmin) {
      res.status(404).send({ error: 'Department admin not found' })
      return
    }

    await departmentAdmin.destroy()
    res.status(204).send(departmentAdmin)
  }
)

export default departmentAdminRouter
