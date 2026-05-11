import { DepartmentAdmin, Thesis } from '../db/models'
import {
  getFindThesesOptions,
  getOrdering,
  getGraderTitles,
  getSortByColumn,
} from '../routes/thesisHelpers'
import { transformThesisData } from '../util/helpers'
import { User as UserType, ThesisData } from '../types'
import CustomValidationError from '../errors/ValidationError'
import CustomAuthorizationError from '../errors/AuthorizationError'

export interface GetPaginatedThesesParams {
  currentUser: UserType
  onlyAuthored?: string | boolean
  onlySupervised?: string | boolean
  onlySeminarSupervised?: string | boolean
  limit?: number | string
  offset?: number | string
  language?: string
  programId?: string
  programNamePartial?: string
  topicPartial?: string
  authorsPartial?: string
  status?: string
  departmentId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export const getPaginatedTheses = async (params: GetPaginatedThesesParams) => {
  const {
    currentUser,
    onlyAuthored,
    onlySupervised,
    onlySeminarSupervised,
    limit = 50,
    offset = 0,
    language = 'en',
    programId,
    programNamePartial,
    topicPartial,
    authorsPartial,
    status,
    departmentId,
    sortBy,
    sortOrder,
  } = params

  const allowedLanguages = ['en', 'fi', 'sv']
  if (!allowedLanguages.includes(language)) {
    throw new CustomValidationError('Invalid language key', {})
  }

  const allowedSortOrder = ['asc', 'desc']
  if (sortOrder && !allowedSortOrder.includes(sortOrder)) {
    throw new CustomValidationError('Invalid sort order', {})
  }

  if (departmentId && !currentUser.isAdmin) {
    const depAdmin = await DepartmentAdmin.findOne({
      where: { userId: currentUser.id, departmentId },
    })

    if (!depAdmin) {
      throw new CustomAuthorizationError(
        'Access denied: insufficient permissions for this department',
        {}
      )
    }
  }

  const sortByColumn = sortBy ? getSortByColumn(sortBy) : undefined

  const options = await getFindThesesOptions({
    programId,
    departmentId,
    programNamePartial,
    topicPartial,
    authorsPartial,
    status,
    language,
    actionUser: currentUser,
    onlyAuthored: String(onlyAuthored) === 'true',
    onlySupervised: String(onlySupervised) === 'true',
    onlySeminarSupervised: String(onlySeminarSupervised) === 'true',
  })

  const { count, rows } = await Thesis.findAndCountAll({
    ...options,
    subQuery: false,
    offset: Number(offset),
    limit: Number(limit),
    order: getOrdering({
      currentUser,
      orderBy: sortByColumn,
      orderDirection: sortOrder,
    }),
    distinct: true,
    bind: { language },
  })

  const thesesRows = rows.map((t) => t.toJSON()) as ThesisData[]
  const thesisGraders = []
  for (const thesis of thesesRows) {
    const singleThesisGraders = await getGraderTitles(thesis)
    thesisGraders.push(singleThesisGraders)
  }

  const theses = transformThesisData(thesesRows, thesisGraders)

  return { theses, totalCount: count }
}
