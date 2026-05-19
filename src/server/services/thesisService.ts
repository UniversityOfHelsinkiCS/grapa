import { type Transaction } from 'sequelize'
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
  getFindThesesOptions,
  getOrdering,
  getGraderTitles,
  getSortByColumn,
  getAndCreateExtUsers,
} from '../routes/thesisHelpers'
import { transformThesisData, transformSingleThesis } from '../util/helpers'
import { User as UserType, ThesisData } from '../types'
import CustomValidationError from '../errors/ValidationError'
import CustomAuthorizationError from '../errors/AuthorizationError'
import CustomNotFoundError from '../errors/NotFoundError'

export const cleanUserProperties = (user: any) => {
  const allowed_keys = [
    'id',
    'username',
    'email',
    'firstName',
    'lastName',
    'affiliation',
  ]
  Object.keys(user).forEach((key) => {
    if (!allowed_keys.includes(key)) user[key] = null
  })
  return user
}

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
  programNamePartial?: string
  topicPartial?: string
  authorsPartial?: string
  status?: string
  departmentId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  hideUserProperties?: boolean
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
    hideUserProperties,
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
  const options = await getFindThesesOptions({
    thesisId: id,
    actionUser: user,
    onlyAuthored,
  })
  // We need to use findAll here because we need to include
  // Supervision model twice (see the explanation comment
  // inside getFindThesesOptions).
  // For some reason. findOne does not support that

  const theses = await Thesis.findAll({ ...options, transaction })
  const thesis = theses.find((t) => t.id === id)

  return thesis
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
