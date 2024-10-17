import { Op } from 'sequelize'
import express from 'express'
import { User } from '../db/models'
import { userFields } from './config'

const USER_FETCH_LIMIT = 100

const usersRouter = express.Router()

const getWhereClauseForOneWordSearch = (search: string) => ({
  [Op.or]: [
    {
      username: {
        [Op.iLike]: `${search}%`,
      },
    },
    {
      firstName: {
        [Op.iLike]: `${search}%`,
      },
    },
    {
      lastName: {
        [Op.iLike]: `${search}%`,
      },
    },
    {
      email: {
        [Op.iLike]: `${search}%`,
      },
    },
    {
      studentNumber: {
        [Op.iLike]: `${search}%`,
      },
    },
  ],
})

const getWhereClauseForTwoWordSearch = (search: string) => {
  const [firstName, lastName] = search.split(' ')
  return {
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
          [Op.iLike]: `${search}%`,
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
  }
}

const getWhereClauseForManyWordSearch = (search: string) => {
  const searchedWords = search.split(' ')
  const [lastName1, ...firstNames1] = searchedWords
  // treat the last word in searchedWords as lastName2 and
  // the rest as firstNames2 i.e. equivalent to
  // const [...firstNames2, lastName2] = searchedWords
  // if it'd be possible in JS :)
  const lastName2 = searchedWords[searchedWords.length - 1]
  const firstNames2 = searchedWords.slice(0, searchedWords.length - 1)

  return {
    [Op.or]: [
      {
        firstName: {
          [Op.iLike]: `${searchedWords}%`,
        },
      },
      {
        firstName: {
          [Op.iLike]: `${firstNames1.join(' ')}%`,
        },
        lastName: {
          [Op.iLike]: `${lastName1}%`,
        },
      },
      {
        firstName: {
          [Op.iLike]: `${firstNames2.join(' ')}%`,
        },
        lastName: {
          [Op.iLike]: `${lastName2}%`,
        },
      },
    ],
  }
}

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

  const searchedWords = trimmedSearch.split(' ')

  if (searchedWords.length === 2) {
    const users = await User.findAll({
      attributes: userFields,
      where: {
        ...getWhereClauseForTwoWordSearch(trimmedSearch),
        ...whereClauses,
      },
      limit: USER_FETCH_LIMIT,
    })
    res.send(users)
  } else if (searchedWords.length > 2) {
    const users = await User.findAll({
      attributes: userFields,
      where: {
        ...getWhereClauseForManyWordSearch(trimmedSearch),
        ...whereClauses,
      },
      limit: USER_FETCH_LIMIT,
    })
    res.send(users)
  } else {
    // the search consists of only one word
    const users = await User.findAll({
      attributes: userFields,
      where: {
        ...getWhereClauseForOneWordSearch(trimmedSearch),
        ...whereClauses,
      },
      limit: USER_FETCH_LIMIT,
    })

    res.send(users)
  }
})

export default usersRouter
