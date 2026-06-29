import { type Transaction, Op } from 'sequelize'
import {
  DepartmentAdmin,
  Grader,
  SeminarSupervision,
  Thesis,
  Supervision,
  Author,
  Approver,
  User,
} from '../db/models'
import {
  buildThesisIncludes,
  buildThesisWhereClause,
  getOrdering,
  getGraderTitles,
  getSortByColumn,
  getAndCreateExtUsers,
} from './thesisHelpers'
import { transformThesisData, transformSingleThesis } from './thesisHelpers'
import { User as UserType, ThesisData } from '../types'
import CustomValidationError from '../errors/ValidationError'
import CustomAuthorizationError from '../errors/AuthorizationError'
import CustomNotFoundError from '../errors/NotFoundError'

import { cleanUserProperties } from './studentService'

export const cleanThesisUserData = (thesis: any) => {
  thesis.authors = thesis.authors.map((user: any) => cleanUserProperties(user))
  thesis.approvers = thesis.approvers.map((user: any) =>
    cleanUserProperties(user)
  )
  thesis.supervisions.forEach((supervision: any) => {
    if (supervision.user)
      supervision.user = cleanUserProperties(supervision.user)
  })
  thesis.graders.forEach((grader: any) => {
    if (grader.user) grader.user = cleanUserProperties(grader.user)
  })
  thesis.seminarSupervisions.forEach((supervision: any) => {
    if (supervision.user)
      supervision.user = cleanUserProperties(supervision.user)
  })
}

export const cleanThesisBulk = (thesisArray: any) => {
  thesisArray.forEach((thesis: any) => {
    cleanThesisUserData(thesis)
  })
  return thesisArray
}

export interface GetPaginatedThesesParams {
  currentUser: UserType
  onlyAuthored?: string | boolean
  onlySupervised?: string | boolean
  onlySeminarSupervised?: string | boolean
  limit?: number | string
  offset?: number | string
  language?: string
  programId?: string
  studyTrackId?: string
  programNamePartial?: string
  topicPartial?: string
  authorsPartial?: string
  status?: string
  departmentId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  hideUserProperties?: boolean
  search?: string
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
    studyTrackId,
    programNamePartial,
    topicPartial,
    authorsPartial,
    status,
    departmentId,
    sortBy,
    sortOrder,
    hideUserProperties,
    search,
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

  const sortByColumn = sortBy ? getSortByColumn(sortBy, language) : undefined

  let formattedSearch = search
  if (search) {
    formattedSearch = search
      .replace(/['|&!():]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .map((word) => `${word}:*`)
      .join(' & ')
  }

  const where = await buildThesisWhereClause({
    programId,
    studyTrackId,
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
    search: formattedSearch || undefined,
  })

  const includes = buildThesisIncludes(programNamePartial, language)

  const { count, rows } = await Thesis.findAndCountAll({
    where,
    include: includes,
    attributes: [
      'id',
      'topic',
      'status',
      'startDate',
      'milestone',
      'milestoneVersion',
      'targetDate',
      'ethesisDate',
      'waysOfWorkingValidUntil',
      'programId',
      'studyTrackId',
      'updatedAt',
    ],
    offset: Number(offset),
    limit: Number(limit),
    order: getOrdering({
      currentUser,
      orderBy: sortByColumn,
      orderDirection: sortOrder,
    }),
    distinct: true,
    bind: {
      language,
      search: formattedSearch,
      authorSearch: authorsPartial ? `%${authorsPartial.trim()}%` : null,
    },
  })

  const thesesRows = rows.map((t) => t.toJSON()) as ThesisData[]
  const thesisGraders = []
  for (const thesis of thesesRows) {
    const singleThesisGraders = await getGraderTitles(thesis)
    thesisGraders.push(singleThesisGraders)
  }

  const theses = transformThesisData(thesesRows, thesisGraders)

  if (hideUserProperties) cleanThesisBulk(theses)

  return { theses, totalCount: count }
}

export const createThesis = async (thesisData: ThesisData, t: Transaction) => {
  const createdThesis = await Thesis.create(thesisData, { transaction: t })

  const extUsers = await getAndCreateExtUsers(thesisData, t)

  await Supervision.bulkCreate(
    thesisData.supervisions.map((supervision) => ({
      userId:
        supervision.user?.id ??
        extUsers.find((u) => u.email === supervision.user?.email)?.id,
      thesisId: createdThesis.id,
      percentage: supervision.percentage,
      isPrimarySupervisor: supervision.isPrimarySupervisor,
    })),
    { transaction: t, validate: true, individualHooks: true }
  )

  await SeminarSupervision.bulkCreate(
    (thesisData.seminarSupervisions ?? [])
      .filter((seminarSupervision) => Boolean(seminarSupervision.user))
      .map((seminarSupervision) => ({
        userId:
          seminarSupervision.user?.id ??
          extUsers.find((u) => u.email === seminarSupervision.user?.email)?.id,
        thesisId: createdThesis.id,
      })),
    { transaction: t, validate: true, individualHooks: true }
  )

  await Author.bulkCreate(
    thesisData.authors.map((author) => ({
      userId: author.id,
      thesisId: createdThesis.id,
    })),
    { transaction: t, validate: true, individualHooks: true }
  )

  // We want to account for the case where approvers array is
  // sent as undefined from the client
  if (thesisData.approvers?.length) {
    await Approver.bulkCreate(
      thesisData.approvers.map((approver) => ({
        userId: approver.id,
        thesisId: createdThesis.id,
      })),
      { transaction: t, validate: true, individualHooks: true }
    )
  }

  // Create the external users from the graders
  await User.bulkCreate(
    thesisData.graders
      .filter((grader) => grader.isExternal)
      .map((grader) => ({
        username: `ext-${grader.user?.email}`,
        firstName: grader.user?.firstName,
        lastName: grader.user?.lastName,
        email: grader.user?.email,
        isExternal: true,
      })),
    {
      transaction: t,
      updateOnDuplicate: ['username'],
      validate: true,
    }
  )

  await Grader.bulkCreate(
    thesisData.graders
      .filter((x) => Boolean(x?.user))
      .map((grader) => ({
        userId:
          grader.user?.id ??
          extUsers.find((u) => u.email === grader.user?.email)?.id,
        thesisId: createdThesis.id,
        isPrimaryGrader: grader?.isPrimaryGrader,
      })),
    { transaction: t, validate: true, individualHooks: true }
  )
  return createdThesis
}

export const fetchThesisById = async (
  id: string,
  user: UserType,
  transaction?: Transaction,
  onlyAuthored?: boolean
) => {
  const where = await buildThesisWhereClause({
    thesisId: id,
    actionUser: user,
    onlyAuthored,
  })

  const includes = buildThesisIncludes()

  const theses = await Thesis.findAll({ where, include: includes, transaction })
  const thesis = theses.find((t) => t.id === id)

  return thesis
}

// Statuses that mean a thesis is no longer active
const INACTIVE_STATUSES = ['COMPLETED', 'CANCELLED', 'ETHESIS_SENT']

export const findThesesByExpirationDates = async (targetDates: Date[]) => {
  const includes = buildThesisIncludes()
  const dateStrings = targetDates.map((d) => d.toISOString().slice(0, 10))
  return Thesis.findAll({
    where: {
      waysOfWorkingValidUntil: { [Op.in]: dateStrings },
      status: { [Op.notIn]: INACTIVE_STATUSES },
    },
    include: includes,
  })
}

export const getSingleThesis = async (
  id: string,
  currentUser: UserType,
  options: { onlyAuthored: boolean }
) => {
  const thesis = await fetchThesisById(
    id,
    currentUser,
    undefined,
    options.onlyAuthored
  )

  if (!thesis) throw new CustomNotFoundError('Thesis not found')

  const graderTitles = await getGraderTitles(thesis)

  const thesisData = transformSingleThesis(
    thesis.toJSON() as ThesisData,
    graderTitles
  )

  return thesisData
}

export const updateThesis = async (
  id: string,
  thesisData: ThesisData,
  transaction: Transaction
) => {
  await Thesis.update(thesisData, { where: { id }, transaction })

  const extUsers = await getAndCreateExtUsers(thesisData, transaction)

  await Supervision.destroy({ where: { thesisId: id }, transaction })
  await Supervision.bulkCreate(
    thesisData.supervisions.map((supervision) => ({
      userId:
        supervision.user?.id ??
        extUsers.find((u) => u.email === supervision.user?.email)?.id,
      thesisId: id,
      percentage: supervision.percentage,
      isPrimarySupervisor: supervision.isPrimarySupervisor,
    })),
    { transaction, validate: true, individualHooks: true }
  )

  await SeminarSupervision.destroy({ where: { thesisId: id }, transaction })
  await SeminarSupervision.bulkCreate(
    (thesisData.seminarSupervisions ?? [])
      .filter((seminarSupervision) => Boolean(seminarSupervision.user))
      .map((seminarSupervision) => ({
        userId:
          seminarSupervision.user?.id ??
          extUsers.find((u) => u.email === seminarSupervision.user?.email)?.id,
        thesisId: id,
      })),
    { transaction, validate: true, individualHooks: true }
  )

  await Grader.destroy({ where: { thesisId: id }, transaction })
  await Grader.bulkCreate(
    thesisData.graders.map((grader) => ({
      userId:
        grader.user?.id ??
        extUsers.find((u) => u.email === grader.user?.email)?.id,
      thesisId: id,
      isPrimaryGrader: grader?.isPrimaryGrader,
    })),
    { transaction, validate: true, individualHooks: true }
  )

  await Author.destroy({ where: { thesisId: id }, transaction })
  await Author.bulkCreate(
    thesisData.authors.map((author) => ({
      userId: author.id,
      thesisId: id,
    })),
    { transaction, validate: true, individualHooks: true }
  )

  await Approver.destroy({ where: { thesisId: id }, transaction })
  // We want to account for the case where approvers array is
  // sent as undefined from the client
  if (thesisData.approvers?.length) {
    await Approver.bulkCreate(
      thesisData.approvers.map((approver) => ({
        userId: approver.id,
        thesisId: id,
      })),
      { transaction, validate: true, individualHooks: true }
    )
  }
}
