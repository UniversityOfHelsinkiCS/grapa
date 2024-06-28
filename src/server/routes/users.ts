import { Op } from 'sequelize'
import express from 'express'
import { User } from '../db/models'

const usersRouter = express.Router()

usersRouter.get('/', async (req, res) => {
  const { search } = req.query as { search: string }

  if (!search) {
    res.send(400, 'Search string must be provided as a query parameter')
  }
  if (search.trim().length < 5) {
    res.send(400, 'Search string must be at least 5 characters long')
  }

  const trimmedSearch = search.trim()

  if (trimmedSearch.split(' ').length === 2) {
    const [firstName, lastName] = trimmedSearch.split(' ')
    const users = await User.findAll({
      where: {
        [Op.and]: [
          {
            firstName: {
              [Op.iLike]: `${firstName}%`,
            },
          },
          {
            lastName: {
              [Op.iLike]: `${lastName}%`,
            },
          },
        ],
      },
    })
    res.send(users)
  } else {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          {
            username: {
              [Op.iLike]: `${trimmedSearch}%`,
            },
          },
          {
            firstName: {
              [Op.iLike]: `${trimmedSearch}%`,
            },
          },
          {
            lastName: {
              [Op.iLike]: `${trimmedSearch}%`,
            },
          },
          {
            email: {
              [Op.iLike]: `${trimmedSearch}%`,
            },
          },
          {
            studentNumber: {
              [Op.iLike]: `${trimmedSearch}%`,
            },
          },
        ],
      },
    })
    res.send(users)
  }
})

export default usersRouter
