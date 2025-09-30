import express, { Response } from 'express'
import { ServerDeleteRequest, ServerGetRequest } from '../types'
import { EthesisAdmin, User } from '../db/models'
import adminHandler from '../middleware/admin'

const ethesisAdminRouter = express.Router()

ethesisAdminRouter.get(
  '/',
  adminHandler,
  async (req: ServerGetRequest, res: Response) => {
    const ethesisAdmins = await EthesisAdmin.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
          required: true,
        },
      ],
    })

    const admins = ethesisAdmins.map((admin) => ({
      id: admin.id,
      userId: admin.userId,
      user: (admin as any).user,
    }))

    res.send(admins)
  }
)

// @ts-expect-error the user middleware updates the req object with user field
ethesisAdminRouter.post('/', adminHandler, async (req: any, res: Response) => {
  const { userId } = req.body

  if (!userId) {
    return res.status(400).send('User ID is required')
  }

  // Check if user exists
  const user = await User.findByPk(userId)
  if (!user) {
    return res.status(404).send('User not found')
  }

  // Check if user is already an ethesis admin
  const existingAdmin = await EthesisAdmin.findOne({ where: { userId } })
  if (existingAdmin) {
    return res.status(409).send('User is already an Ethesis admin')
  }

  const newAdmin = await EthesisAdmin.create({ userId })

  // Fetch the created admin with user details
  const createdAdmin = await EthesisAdmin.findByPk(newAdmin.id, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'firstName', 'lastName', 'email', 'username'],
        required: true,
      },
    ],
  })

  const adminData = {
    id: createdAdmin.id,
    userId: createdAdmin.userId,
    user: (createdAdmin as any).user,
  }

  res.status(201).send(adminData)
})

ethesisAdminRouter.delete(
  '/:id',
  adminHandler,
  async (req: ServerDeleteRequest, res: Response) => {
    const { id } = req.params

    const ethesisAdmin = await EthesisAdmin.findByPk(id)
    if (!ethesisAdmin) {
      return res.status(404).send('Ethesis admin not found')
    }

    await ethesisAdmin.destroy()
    res.status(204).send()
  }
)

export default ethesisAdminRouter
