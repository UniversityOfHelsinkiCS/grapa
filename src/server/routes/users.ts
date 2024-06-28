import { Op } from 'sequelize'
import express from 'express'
import { User } from '../db/models'
import { userFields } from './config'

const usersRouter = express.Router()

interface UserSearchQuery {
  search?: string
  onlyWithStudyRight?: boolean
  onlyEmployees?: boolean
}

usersRouter.get('/', async (req, res) => {
  const { search, onlyEmployees, onlyWithStudyRight } =
    req.query as UserSearchQuery

  if (!search) {
    res.send(400, 'Search string must be provided as a query parameter')
  }
  if (search.trim().length < 5) {
    res.send(400, 'Search string must be at least 5 characters long')
  }

  const trimmedSearch = search.trim()

  let whereClauses: Record<string, any> = {}
  if (onlyWithStudyRight) {
    whereClauses = {
      ...whereClauses,
      hasStudyRight: {
        [Op.is]: true,
      },
    }
  }
  if (onlyEmployees) {
    whereClauses = {
      ...whereClauses,
      employeeNumber: {
        [Op.not]: null,
      },
    }
  }

  if (trimmedSearch.split(' ').length === 2) {
    const [firstName, lastName] = trimmedSearch.split(' ')
    const users = await User.findAll({
      attributes: userFields,
      where: {
        firstName: {
          [Op.iLike]: `${firstName}%`,
        },
        lastName: {
          [Op.iLike]: `${lastName}%`,
        },
        ...whereClauses,
      },
    })
    res.send(users)
  } else {
    const users = await User.findAll({
      attributes: userFields,
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
        ...whereClauses,
      },
    })
    console.log(users)
    res.send(users)
  }
})

export default usersRouter
