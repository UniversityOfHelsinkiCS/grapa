import express from 'express'
import { User } from '../db/models'

const usersRouter = express.Router()

usersRouter.get('/', async (_, res) => {
  const users = await User.findAll()
  res.send(users)
})

export default usersRouter
