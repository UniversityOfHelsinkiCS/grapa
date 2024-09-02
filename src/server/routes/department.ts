import express, { Response } from 'express'
import { Includeable } from 'sequelize'
import { Department, DepartmentAdmin } from '../db/models'
import { RequestWithUser } from '../types'

const departmentRouter = express.Router()

// @ts-expect-error the user middleware updates the req object with user field
departmentRouter.get('/', async (req: RequestWithUser, res: Response) => {
  const { isAdmin } = req.user
  const includeNotManaged = req.query.includeNotManaged === 'true'

  const includes: Includeable[] = []

  if (!isAdmin && !includeNotManaged) {
    includes.push({
      model: DepartmentAdmin,
      attributes: [],
      where: { userId: req.user.id },
      required: true,
    })
  }

  const departments = await Department.findAll({
    attributes: ['id', 'name'],
    include: includes,
    order: [['name', 'ASC']],
  })
  res.send(departments)
})

export default departmentRouter
