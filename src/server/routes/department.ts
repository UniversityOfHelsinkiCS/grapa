import express, { Response } from 'express'
import { Includeable, literal } from 'sequelize'
import { RequestWithUser } from '../types'
import { Department, DepartmentAdmin } from '../db/models'
import ethesisUserHandler from '../middleware/ethesisUser'

const departmentRouter = express.Router()

departmentRouter.get(
  '/',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user
    const language = (req.query.language ?? 'en') as string
    const includeNotManaged = req.query.includeNotManaged === 'true'
    const includeDisabled = req.query.includeDisabled === 'true'

    const where: any = {}
    if (!includeDisabled) {
      where.enabled = true
    }

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
      where,
      attributes: ['id', 'name', 'enabled'],
      include: includes,
      order: [[literal(`name->>$language`), 'ASC']],
      bind: { language },
    })

    res.send(departments)
  }
)

departmentRouter.put(
  '/:id',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { id: departmentId } = req.params
    const { isAdmin } = req.user
    const { name, enabled } = req.body

    if (!departmentId || typeof departmentId !== 'string') {
      return res.status(400).send({ error: 'Department ID is required' })
    }

    if (!name || typeof name !== 'object' || Array.isArray(name)) {
      return res.status(400).send({ error: 'Invalid name payload' })
    }

    if (!isAdmin) {
      return res.status(403).send({ error: 'Forbidden' })
    }

    const department = await Department.findByPk(departmentId)

    if (!department) {
      return res.status(404).send({ error: 'Department not found' })
    }

    const updateData: any = {}
    if (name) updateData.name = name
    if (enabled !== undefined) updateData.enabled = enabled

    const [, updatedDepartments] = await Department.update(updateData, {
      where: { id: departmentId },
      returning: true,
    })

    return res.status(200).send(updatedDepartments[0])
  }
)

departmentRouter.post(
  '/',
  ethesisUserHandler,
  // @ts-expect-error the user middleware updates the req object with user field
  async (req: RequestWithUser, res: Response) => {
    const { isAdmin } = req.user
    const { id, name, enabled } = req.body

    if (!isAdmin) {
      return res.status(403).send({ error: 'Forbidden' })
    }

    if (!name || typeof name !== 'object' || Array.isArray(name)) {
      return res.status(400).send({ error: 'Invalid name payload' })
    }

    if (id && typeof id !== 'string') {
      return res.status(400).send({ error: 'Invalid id payload' })
    }

    const newDepartmentData: any = { name }
    if (id) {
      newDepartmentData.id = id
    }
    if (enabled !== undefined) {
      newDepartmentData.enabled = enabled
    }

    try {
      const department = await Department.create(newDepartmentData)
      return res.status(201).send(department)
    } catch (error: any) {
      return res
        .status(400)
        .send({ error: error?.message || 'Failed to create department' })
    }
  }
)

export default departmentRouter
