import express, { Response } from 'express'
import { Includeable, literal } from 'sequelize'
import { RequestWithUser } from '../types'
import { Department, DepartmentAdmin } from '../db/models'

const departmentRouter = express.Router()

// @ts-expect-error the user middleware updates the req object with user field
departmentRouter.get('/', async (req: RequestWithUser, res: Response) => {
  const { isAdmin } = req.user
  const language = (req.query.language ?? 'en') as string
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

  // Validate that the language is one of the allowed keys
  const allowedLanguages = ['en', 'fi', 'sv']
  if (!allowedLanguages.includes(language)) {
    throw new Error('Invalid language key')
  }

  const departments = await Department.findAll({
    attributes: ['id', 'name'],
    include: includes,
    order: [[literal(`name->>$language`), 'ASC']],
    bind: { language },
  })

  res.send(departments)
})

export default departmentRouter
