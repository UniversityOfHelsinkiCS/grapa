import { Op } from 'sequelize'
import { User } from '../db/models'
import { restrictedUserFields } from '../routes/config'

import {
  getWhereClauseForManyWordSearch,
  getWhereClauseForOneWordSearch,
  getWhereClauseForTwoWordSearch,
} from '../routes/usersSearchHelpers'

const USER_FETCH_LIMIT = 100

export const getUsersBySearchStudents = async (search: string) => {
  if (!search) {
    throw Error('Search string must be provided as a query parameter')
  }

  const trimmedSearch: string = search.trim()

  if (trimmedSearch.length < 5) {
    throw Error('Search string must be at least 5 characters long')
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
  return users
}
