import express, { Response } from 'express'
import { QueryTypes } from 'sequelize'
import { RequestWithUser } from '../types'
import { sequelize } from '../db/connection'

const departmentRouter = express.Router()

const getDepartmentQueryStr = (isAdmin: boolean, includeNotManaged: boolean) =>
  `
    SELECT departments.id, departments.name
    FROM departments
    ${!isAdmin && !includeNotManaged ? 'INNER JOIN department_admins ON departments.id = department_admins.department_id AND department_admins.user_id = $userId' : ''}
    ORDER BY name->>$language ASC
    `

// @ts-expect-error the user middleware updates the req object with user field
departmentRouter.get('/', async (req: RequestWithUser, res: Response) => {
  const { isAdmin } = req.user
  const language = (req.query.language ?? 'en') as string
  const includeNotManaged = req.query.includeNotManaged === 'true'

  // Validate that the language is one of the allowed keys
  const allowedLanguages = ['en', 'fi', 'sv']
  if (!allowedLanguages.includes(language)) {
    throw new Error('Invalid language key')
  }

  const departments = await sequelize.query(
    getDepartmentQueryStr(isAdmin, includeNotManaged),
    {
      bind: {
        userId: req.user.id,
        language,
      },
      type: QueryTypes.SELECT,
      logging: console.log,
    }
  )

  res.send(departments)
})

export default departmentRouter
