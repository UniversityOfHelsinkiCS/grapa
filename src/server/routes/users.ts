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
    res.status(400).send('Search string must be provided as a query parameter')
  }
  if (search.trim().length < 5) {
    res.status(400).send('Search string must be at least 5 characters long')
  }

  const trimmedSearch = search.trim()

  let whereClauses: Record<string, any> = {
    email: {
      [Op.not]: null,
    },
  }

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
        [Op.or]: [
          // assume that the first word is the first name and the second word is the last name
          {
            firstName: {
              [Op.iLike]: `${firstName}%`,
            },
            lastName: {
              [Op.iLike]: `${lastName}%`,
            },
          },
          // assume that both words are the "first name", this is because
          // first name includes middle names as well. Thus this allows
          // for searching with first and middle names
          {
            firstName: {
              [Op.iLike]: `${trimmedSearch}%`,
            },
          },
          // sometimes, users might first type in last name and then first name
          // so we need to account for that as well
          {
            firstName: {
              [Op.iLike]: `${lastName}%`,
            },
            lastName: {
              [Op.iLike]: `${firstName}%`,
            },
          },
        ],
        ...whereClauses,
      },
      limit: 100,
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
      limit: 100,
    })

    res.send(users)
  }
})

export default usersRouter
