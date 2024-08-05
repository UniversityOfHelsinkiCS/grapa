import express, { Response } from 'express'
import { Department } from '../db/models'
import { RequestWithUser } from '../types'

const departmentRouter = express.Router()

// @ts-expect-error the user middleware updates the req object with user field
departmentRouter.get('/', async (_: RequestWithUser, res: Response) => {
  const departments = await Department.findAll({
    attributes: ['id', 'name'],
    order: [['name', 'ASC']],
  })
  res.send(departments)
})

export default departmentRouter
