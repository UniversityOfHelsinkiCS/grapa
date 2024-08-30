import express, { Response } from 'express'
import { literal, Op } from 'sequelize'

import { Department, DepartmentAdmin, User } from '../db/models'
import { RequestWithUser } from '../types'

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
        res.status(403).send({ error: 'Forbidden' })
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
        res
          .status(403)
          .send({
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
