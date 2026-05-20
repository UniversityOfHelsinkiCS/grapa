import { Op } from 'sequelize'
import { User } from '../db/models'
import { restrictedUserFields } from '../routes/config'

import {
  getWhereClauseForManyWordSearch,
  getWhereClauseForOneWordSearch,
  getWhereClauseForTwoWordSearch,
} from '../routes/usersSearchHelpers'

const USER_FETCH_LIMIT = 100

export const getUsersBySearchStudents = async (
  search: string,
  onlyWithStudyRight: boolean,
  onlyEmployees: boolean
) => {
  const trimmedSearch: string = search.trim()

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
    attributes: restrictedUserFields,
    where: whereClauses,
    limit: USER_FETCH_LIMIT,
  })
  return users
}
