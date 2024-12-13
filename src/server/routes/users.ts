import { Op } from 'sequelize'
import express from 'express'
import { User } from '../db/models'
import { userFields } from './config'
import {
  getWhereClauseForManyWordSearch,
  getWhereClauseForOneWordSearch,
  getWhereClauseForTwoWordSearch,
} from './usersSearchHelpers'

const USER_FETCH_LIMIT = 100

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
      email: {
        [Op.not]: null,
      },
      employeeNumber: {
        [Op.not]: null,
      },
    }
  }

  const searchedWords = trimmedSearch.split(' ')

  if (searchedWords.length === 2) {
    whereClauses = {
      ...whereClauses,
      ...getWhereClauseForTwoWordSearch(trimmedSearch),
    }
  } else if (searchedWords.length > 2) {
    whereClauses = {
      ...whereClauses,
      ...getWhereClauseForManyWordSearch(trimmedSearch),
    }
  } else {
    // the search consists of only one word
    whereClauses = {
      ...whereClauses,
      ...getWhereClauseForOneWordSearch(trimmedSearch),
    }
  }

  const users = await User.findAll({
    attributes: userFields,
    where: whereClauses,
    limit: USER_FETCH_LIMIT,
  })
  res.send(users)
})

export default usersRouter
