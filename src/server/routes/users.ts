import { Op } from 'sequelize'
import express from 'express'
import { User } from '../db/models'

const usersRouter = express.Router()

usersRouter.get('/', async (req, res) => {
  const { search } = req.query

  if (!search) {
    res.send(403, 'Search string must be provided as a query parameter')
  }
  if (search.trim().length < 5) {
    res.send(403, 'Search string must be at least 5 characters long')
  }

  const trimmedSearch = search.trim()

  const users = await User.findAll({
    where: {
      [Op.or]: [
        {
          username: {
            [Op.like]: `%${trimmedSearch}%`,
          },
        },
        {
          firstName: {
            [Op.like]: `%${trimmedSearch}%`,
          },
        },
        {
          lastName: {
            [Op.like]: `%${trimmedSearch}%`,
          },
        },
        {
          email: {
            [Op.like]: `%${trimmedSearch}%`,
          },
        },
      ],
    },
  })

  res.send(users)
})

export default usersRouter
