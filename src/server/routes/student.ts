import express from 'express'

import { RequestWithUser } from '../types'
import withStudyRight from '../middleware/withStudyRight'
import { Op } from 'sequelize'
import { User } from '../db/models'
import { restrictedUserFields } from './config'

import {
  getWhereClauseForManyWordSearch,
  getWhereClauseForOneWordSearch,
  getWhereClauseForTwoWordSearch,
} from './usersSearchHelpers'

const USER_FETCH_LIMIT = 100

const studentRouter = express.Router()

studentRouter.use(withStudyRight)

// add student specific routes here. For example:

studentRouter.get('/', async (req: RequestWithUser, res: any) => {
  return res.send({})
})

studentRouter.get('/users', async (req: RequestWithUser, res: any) => {
  const { search } = req.query

  if (!search) {
    res.status(400).send('Search string must be provided as a query parameter')
    return
  }

  const trimmedSearch: string = search.trim()

  if (trimmedSearch.length < 5) {
    res.status(400).send('Search string must be at least 5 characters long')
    return
  }

  let whereClauses: Record<string, any> = {
    hasStudyRight: {
      [Op.is]: true,
    },
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
    attributes: restrictedUserFields,
    where: whereClauses,
    limit: USER_FETCH_LIMIT,
  })
  res.send(users)
})

export default studentRouter
