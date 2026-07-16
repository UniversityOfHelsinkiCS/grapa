import { Includeable, literal, Op, Order, Transaction } from 'sequelize'
import dayjs from 'dayjs'
import { uniqBy } from 'lodash-es'
import { userFields } from '../routes/config'
import {
  Grader,
  SeminarSupervision,
  Supervision,
  User,
  Attachment,
  ProgramManagement,
  EventLog,
  Thesis,
  Program,
  StudyTrack,
  Author,
  Approver,
  StudyTrackManagement,
  Department,
} from '../db/models'
import {
  getSecondaryStudyTrackIds,
  getPrimaryStudyTrackId,
} from '../util/studyTracks'
import {
  ThesisData,
  User as UserType,
  SupervisionData,
  ThesisStatistics,
} from '../types'
import logger from '../util/logger'

import { Literal } from 'sequelize/types/utils'
import { TitleData } from '../types'
import { EMPLOYEE_TOKEN, GW_API_URL } from '../util/config'
import { inStaging, inTest, inE2EMode } from '../../config'

const getOrderLiteralBasedOnThesesApprovals = (currentUser: UserType) =>
  literal(`(
    EXISTS (
      SELECT 1
      FROM approvers
      WHERE
        approvers.thesis_id = "Thesis".id AND
        approvers.user_id = '${currentUser.id}'
    )
  )`)

interface GetOrderingProps {
  currentUser: UserType
  orderBy: string | any[] | Literal | undefined
  orderDirection: 'asc' | 'desc' | undefined
}
export const getOrdering = ({
  currentUser,
  orderBy,
  orderDirection,
}: GetOrderingProps): Order => {
  if (orderBy && orderDirection) {
    if (Array.isArray(orderBy)) {
      return [[...orderBy, orderDirection]] as Order
    }
    return [[orderBy, orderDirection]] as Order
  }

  // If no ordering is specified, we want to order the theses
  // based on the current user's approvals and the target date.
  return [
    [getOrderLiteralBasedOnThesesApprovals(currentUser), 'DESC'],
    ['targetDate', 'ASC'],
  ]
}

export interface ThesisFiltersOptions {
  thesisId?: string
  programId?: string
  studyTrackId?: string
  departmentId?: string
  programNamePartial?: string
  topicPartial?: string
  authorsPartial?: string
  status?: string
  language?: string
  actionUser: UserType
  onlySupervised?: boolean
  onlySeminarSupervised?: boolean
  onlyAuthored?: boolean
  search?: string
  missingSecondGrader?: boolean
  lastMilestone?: boolean
  ethesisReadyStudentStarted?: boolean
  hideStudentStartedEthesis?: boolean
}

export const buildThesisIncludes = (
  programNamePartial?: string,
  language?: string
): Includeable[] => {
  const actualLanguage = language ?? 'en'
  const allowedLanguages = ['fi', 'sv', 'en']
  if (!allowedLanguages.includes(actualLanguage)) {
    throw new Error('Invalid language key')
  }

  const programWhere = programNamePartial
    ? {
        [`name.${actualLanguage}`]: {
          [Op.iLike]: `%${programNamePartial.trim()}%`,
        },
      }
    : undefined

  return [
    {
      model: Supervision,
      as: 'supervisions',
      attributes: ['percentage', 'isPrimarySupervisor'],
      separate: true,
      include: [{ model: User, as: 'user', attributes: userFields }],
    },
    {
      model: SeminarSupervision,
      as: 'seminarSupervisions',
      separate: true,
      include: [{ model: User, as: 'user', attributes: userFields }],
    },
    {
      model: Grader,
      as: 'graders',
      attributes: ['isPrimaryGrader'],
      separate: true,
      include: [{ model: User, as: 'user', attributes: userFields }],
    },
    { model: User, as: 'authors', attributes: userFields },
    { model: User, as: 'approvers', attributes: userFields },
    {
      model: Attachment,
      as: 'researchPlan',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'researchPlan' },
      required: false,
    },
    {
      model: Attachment,
      as: 'waysOfWorking',
      attributes: ['filename', ['original_name', 'name'], 'mimetype'],
      where: { label: 'waysOfWorking' },
      required: false,
    },
    {
      model: Program,
      as: 'program',
      attributes: ['id', 'name', 'options'],
      where: programWhere,
      required: true,
    },
  ]
}

const getStudyTrackIds = async (studyTrackId: string): Promise<string[]> => {
  const studyTrack = await StudyTrack.findByPk(studyTrackId, {
    include: [{ model: Program, as: 'program' }],
  })
  if (!studyTrack) return [studyTrackId]
  const options =
    (studyTrack as any).Program?.options || (studyTrack as any).program?.options
  const secondaryIds = getSecondaryStudyTrackIds(options, studyTrackId)
  return [studyTrackId, ...secondaryIds]
}

const buildPermissionsConditions = async (
  actionUser: UserType,
  departmentId?: string,
  onlySupervised?: boolean,
  onlySeminarSupervised?: boolean,
  onlyAuthored?: boolean
) => {
  // If departmentId is set, or user is admin, AND they don't explicitly filter by my role, no restriction needed here (department subquery added later)
  if (
    !onlySupervised &&
    !onlySeminarSupervised &&
    !onlyAuthored &&
    (departmentId || actionUser.isAdmin || actionUser.ethesisAdmin)
  ) {
    return null
  }

  if (onlySeminarSupervised) {
    return literal(
      `EXISTS (SELECT 1 FROM "${SeminarSupervision.tableName}" WHERE "${SeminarSupervision.tableName}"."thesis_id" = "Thesis"."id" AND "${SeminarSupervision.tableName}"."user_id" = '${actionUser.id}')`
    )
  }
  if (onlyAuthored) {
    return literal(
      `EXISTS (SELECT 1 FROM "${Author.tableName}" WHERE "${Author.tableName}"."thesis_id" = "Thesis"."id" AND "${Author.tableName}"."user_id" = '${actionUser.id}')`
    )
  }

  // Otherwise, user is restricted to what they supervise, approve, or programs/study tracks they manage
  const programManagement =
    onlySupervised || onlySeminarSupervised || onlyAuthored
      ? []
      : await ProgramManagement.findAll({
          attributes: ['programId'],
          where: { userId: actionUser.id },
        })

  const programIds = programManagement.map((pm) => pm.programId)

  const studyTrackManagement =
    onlySupervised || onlySeminarSupervised || onlyAuthored
      ? []
      : await StudyTrackManagement.findAll({
          attributes: ['studyTrackId'],
          where: { userId: actionUser.id },
        })

  const studyTrackIds = studyTrackManagement.map((stm) => stm.studyTrackId)

  const expandedStudyTrackIds = new Set<string>(studyTrackIds)
  if (studyTrackIds.length > 0) {
    const studyTracks = await StudyTrack.findAll({
      where: { id: { [Op.in]: studyTrackIds } },
      include: [{ model: Program, as: 'program' }],
    })
    for (const st of studyTracks) {
      const options =
        (st as any).Program?.options || (st as any).program?.options
      getSecondaryStudyTrackIds(options, st.id).forEach((id) =>
        expandedStudyTrackIds.add(id)
      )
    }
  }

  const orConditions: any[] = [
    literal(
      `EXISTS (SELECT 1 FROM "${Supervision.tableName}" WHERE "${Supervision.tableName}"."thesis_id" = "Thesis"."id" AND "${Supervision.tableName}"."user_id" = '${actionUser.id}')`
    ),
    literal(
      `EXISTS (SELECT 1 FROM "${Approver.tableName}" WHERE "${Approver.tableName}"."thesis_id" = "Thesis"."id" AND "${Approver.tableName}"."user_id" = '${actionUser.id}')`
    ),
  ]

  if (programIds.length > 0) {
    orConditions.push({ programId: programIds })
  }
  if (expandedStudyTrackIds.size > 0) {
    orConditions.push({ studyTrackId: Array.from(expandedStudyTrackIds) })
  }

  return {
    [Op.or]: orConditions,
  }
}

export const buildThesisWhereClause = async (options: ThesisFiltersOptions) => {
  const {
    thesisId,
    programId,
    studyTrackId,
    departmentId,
    topicPartial,
    authorsPartial,
    status,
    search,
    actionUser,
    onlySupervised,
    onlySeminarSupervised,
    onlyAuthored,
    missingSecondGrader,
    lastMilestone,
    ethesisReadyStudentStarted,
    hideStudentStartedEthesis,
  } = options

  const whereClause: any = {}
  const andConditions: any[] = []

  // 1. Thesis ID
  if (thesisId) {
    whereClause.id = thesisId
  }

  // 2. Authors
  if (authorsPartial) {
    andConditions.push(
      literal(
        `EXISTS (SELECT 1 FROM "authors" INNER JOIN "users" ON "authors"."user_id" = "users"."id" WHERE "authors"."thesis_id" = "Thesis"."id" AND ("users"."first_name" || ' ' || "users"."last_name" ILIKE $authorSearch OR "users"."last_name" || ' ' || "users"."first_name" ILIKE $authorSearch OR "users"."username" ILIKE $authorSearch OR "users"."student_number" ILIKE $authorSearch OR "users"."email" ILIKE $authorSearch))`
      )
    )
  }

  // 3. Exact matches
  if (programId) whereClause.programId = programId
  if (status) whereClause.status = status
  if (topicPartial) {
    whereClause.topic = { [Op.iLike]: `%${topicPartial.trim()}%` }
  }

  // 4. Study Track (with secondary expansion)
  if (studyTrackId) {
    const studyTrackIds = await getStudyTrackIds(studyTrackId)
    whereClause.studyTrackId = { [Op.in]: studyTrackIds }
  }

  // 5. Department
  if (departmentId) {
    andConditions.push(
      literal(
        `EXISTS (SELECT 1 FROM "${Supervision.tableName}" INNER JOIN "${User.tableName}" ON "${Supervision.tableName}"."user_id" = "${User.tableName}"."id" WHERE "${Supervision.tableName}"."thesis_id" = "Thesis"."id" AND "${User.tableName}"."department_id" = '${departmentId}')`
      )
    )
  }

  // 6. Search
  if (search) {
    andConditions.push(
      literal(
        `(EXISTS (SELECT 1 FROM theses WHERE theses.fts_index @@ to_tsquery('simple', $search) AND theses.id = "Thesis".id) OR EXISTS (SELECT 1 FROM authors INNER JOIN users ON authors.user_id = users.id WHERE authors.thesis_id = "Thesis".id AND users.fts_index @@ to_tsquery('simple', $search)))`
      )
    )
  }

  // 7. Custom complex filters
  if (missingSecondGrader) {
    andConditions.push(
      literal(
        `(SELECT COUNT(*) FROM graders WHERE graders.thesis_id = "Thesis".id) < 2`
      )
    )
  }

  if (lastMilestone) {
    andConditions.push(
      { status: 'IN_PROGRESS' },
      literal(
        `(
          (SELECT jsonb_array_length(options->'milestones'->'versions'->CAST(COALESCE("Thesis"."milestone_version", -1) AS int)) FROM "programs" WHERE id = "Thesis"."program_id") > 0
          AND
          "Thesis"."milestone" = (SELECT jsonb_array_length(options->'milestones'->'versions'->CAST(COALESCE("Thesis"."milestone_version", -1) AS int)) FROM "programs" WHERE id = "Thesis"."program_id")
        )`
      )
    )
  }

  if (ethesisReadyStudentStarted) {
    andConditions.push(
      { status: 'ETHESIS' },
      literal(
        `(SELECT options->>'allowStudentStartedProcess' FROM "programs" WHERE id = "Thesis"."program_id") = 'true'`
      )
    )
  }

  if (hideStudentStartedEthesis) {
    andConditions.push(
      literal(
        `NOT ("Thesis".status = 'ETHESIS' AND COALESCE((SELECT options->>'allowStudentStartedProcess' FROM "programs" WHERE id = "Thesis"."program_id"), 'false') = 'true')`
      )
    )
  }

  // 8. Permissions
  const permissionCondition = await buildPermissionsConditions(
    actionUser,
    departmentId,
    onlySupervised,
    onlySeminarSupervised,
    onlyAuthored
  )
  if (permissionCondition) {
    andConditions.push(permissionCondition)
  }

  if (andConditions.length > 0) {
    whereClause[Op.and] = andConditions
  }

  return whereClause
}

export const getAndCreateExtUsers = async (
  thesisData: ThesisData,
  transaction: Transaction
) => {
  const gradersAndSupervisors = [
    ...thesisData.supervisions,
    ...(thesisData.seminarSupervisions ?? []),
    ...thesisData.graders,
  ]

  const nonDuplicateGradersAndSupervisors = uniqBy(
    gradersAndSupervisors,
    (x) => x.user?.email
  )

  // Create the external users from the graders and supervisions
  const extUsers = await User.bulkCreate(
    nonDuplicateGradersAndSupervisors
      .filter((person) => person.isExternal)
      .map((person) => ({
        username: `ext-${person.user?.email}`,
        firstName: person.user?.firstName,
        lastName: person.user?.lastName,
        email: person.user?.email,
        affiliation: person.user?.affiliation,
        isExternal: true,
      })),
    {
      transaction,
      updateOnDuplicate: [
        'username',
        'firstName',
        'lastName',
        'email',
        'affiliation',
      ],
      validate: true,
    }
  )

  return extUsers
}

export const titlesGraderGroup = [
  'professor',
  'assistant professor',
  'associate professor',
  'research director',
  'senior university lecturer',
  'university lecturer',
  'postdoctoral researcher',
]

export const getEmployeeTitles = async (search: string): Promise<TitleData> => {
  if (inStaging || inTest || inE2EMode) {
    const employeeMockData = [
      {
        username: 'admini3',
        titles: [
          {
            fi: 'vanhempi yliopistonlehtori',
            en: 'Senior University Lecturer',
            sv: 'Senior Univeristy Lecturer',
          },
        ],
      },
      {
        username: 'program-supervisor1',
        titles: [
          {
            fi: 'professori',
            en: 'Professor',
            sv: 'professor',
          },
        ],
      },
    ]
    const data = employeeMockData.filter((data) => data.username === search)
    return data.length > 0 ? data[0] : { username: search, titles: [] }
  }

  const url = `${GW_API_URL}employeeinformation/v1?search=${search}`

  try {
    const response = await fetch(url, {
      headers: { 'x-api-key': EMPLOYEE_TOKEN },
    })

    if (!response.ok) {
      return { username: search, titles: [] }
    }

    const payload = await response.json()

    return normalizeEmployeeTitlesPayload(payload, search)
  } catch (e) {
    logger.error('Failed to fetch employee titles:', e)
    return { username: search, titles: [] }
  }
}

export const normalizeEmployeeTitlesPayload = (
  payload: unknown,
  search: string
): TitleData => {
  type EmployeeTitlePayloadEntry = {
    username?: string
    titles?: unknown
  }

  const wrappedPayload =
    payload && typeof payload === 'object' && 'data' in payload ? payload : null

  const data: EmployeeTitlePayloadEntry[] = Array.isArray(payload)
    ? (payload as EmployeeTitlePayloadEntry[])
    : wrappedPayload && Array.isArray(wrappedPayload.data)
      ? (wrappedPayload.data as EmployeeTitlePayloadEntry[])
      : payload && typeof payload === 'object' && 'username' in payload
        ? [payload as EmployeeTitlePayloadEntry]
        : []

  const mappedData = data.map((dataValues) => ({
    username: dataValues.username ?? search,
    titles: Array.isArray(dataValues.titles) ? dataValues.titles : [],
  }))

  return mappedData.length > 0
    ? mappedData[0]
    : { username: search, titles: [] }
}

export const handleStatusChangeEventLog = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType | null,
  transaction: Transaction
) => {
  if (originalThesis.status !== updatedThesis.status) {
    await EventLog.create(
      {
        userId: actionUser?.id,
        thesisId: originalThesis.id,
        type: 'THESIS_STATUS_CHANGED',
        data: {
          from: originalThesis.status,
          to: updatedThesis.status,
        },
      },
      { transaction }
    )
  }
}

export const handleGradersChangeEventLog = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType,
  transaction: Transaction
) => {
  const originalGraders = originalThesis.graders
  const updatedGraders = updatedThesis.graders

  const removedGraders = originalGraders.filter(
    (originalGrader) =>
      !updatedGraders.some(
        (updatedGrader) =>
          updatedGrader.user?.email === originalGrader.user.email
      )
  )

  const addedGraders = updatedGraders.filter(
    (updatedGrader) =>
      !originalGraders.some(
        (originalGrader) =>
          originalGrader.user.email === updatedGrader.user?.email
      )
  )

  const changedGraders = originalGraders.filter((originalGrader) => {
    const updatedGrader = updatedGraders.find(
      (grader) => grader.user?.email === originalGrader.user.email
    )
    return updatedGrader?.isPrimaryGrader !== originalGrader.isPrimaryGrader
  })

  if (removedGraders.length || addedGraders.length || changedGraders.length) {
    await EventLog.create(
      {
        userId: actionUser.id,
        thesisId: originalThesis.id,
        type: 'THESIS_GRADERS_CHANGED',
        data: {
          originalGraders: originalThesis.graders,
          updatedGraders: updatedThesis.graders,
        },
      },
      { transaction }
    )
  }
}

export const handleSupervisionsChangeEventLog = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType,
  transaction: Transaction
) => {
  const originalSupervisions = originalThesis.supervisions
  const updatedSupervisions = updatedThesis.supervisions

  const removedSupervisions = originalSupervisions.filter(
    (originalSupervision) =>
      !updatedSupervisions.some(
        (updatedSupervision) =>
          updatedSupervision.user?.email === originalSupervision.user.email
      )
  )

  const addedSupervisions = updatedSupervisions.filter(
    (updatedSupervision) =>
      !originalSupervisions.some(
        (originalSupervision) =>
          originalSupervision.user.email === updatedSupervision.user?.email
      )
  )

  const changedSupervisions = originalSupervisions.filter(
    (originalSupervision) => {
      const updatedSupervision = updatedSupervisions.find(
        (supervision) =>
          supervision.user?.email === originalSupervision.user.email
      )
      return (
        updatedSupervision?.isPrimarySupervisor !==
          originalSupervision.isPrimarySupervisor ||
        updatedSupervision?.percentage !== originalSupervision.percentage
      )
    }
  )

  if (
    removedSupervisions.length ||
    addedSupervisions.length ||
    changedSupervisions.length
  ) {
    await EventLog.create(
      {
        userId: actionUser.id,
        thesisId: originalThesis.id,
        type: 'THESIS_SUPERVISIONS_CHANGED',
        data: {
          originalSupervisions: originalThesis.supervisions,
          updatedSupervisions: updatedThesis.supervisions,
        },
      },
      { transaction }
    )
  }
}

export const handleChangeEventLogs = async (
  originalThesis: Thesis,
  updatedThesis: Thesis,
  actionUser: UserType,
  transaction: Transaction
) => {
  await handleStatusChangeEventLog(
    originalThesis,
    updatedThesis,
    actionUser,
    transaction
  )
  await handleGradersChangeEventLog(
    originalThesis,
    updatedThesis,
    actionUser,
    transaction
  )
  await handleSupervisionsChangeEventLog(
    originalThesis,
    updatedThesis,
    actionUser,
    transaction
  )
}
export const getGraderTitles = async (thesis: ThesisData | Thesis) => {
  const graderUsernames = thesis.graders
    .map((grader) => (grader.user.isExternal ? null : grader.user.username))
    .filter((username) => !!username)

  const graderTitles = await Promise.all(
    graderUsernames.map((username) => getEmployeeTitles(username))
  )

  return graderTitles
}

export const getSortByColumn = (
  sortBy: string,
  language: string
):
  | 'status'
  | 'topic'
  | Literal
  | 'startDate'
  | 'targetDate'
  | 'waysOfWorkingValidUntil' => {
  switch (sortBy) {
    case 'status':
      return 'status'
    case 'topic':
      return 'topic'
    case 'programId':
      return literal(
        `(SELECT "programs"."name"->>'${language}' 
          FROM "programs" 
          INNER JOIN "theses" ON "programs"."id" = "theses"."program_id" 
          WHERE "theses"."id" = "Thesis"."id")`
      )
    case 'authors':
      return literal(
        `(SELECT "users"."last_name" 
          FROM "users" 
          INNER JOIN "authors" ON "users"."id" = "authors"."user_id" 
          WHERE "authors"."thesis_id" = "Thesis"."id" 
          ORDER BY "users"."last_name" ASC 
          LIMIT 1)`
      )
    case 'startDate':
      return 'startDate'
    case 'targetDate':
      return 'targetDate'
    case 'waysOfWorkingValidUntil':
      return 'waysOfWorkingValidUntil'
    default:
      return undefined
  }
}

export const getTotalPercentage = (supervisions: SupervisionData[]) =>
  supervisions.reduce((total, selection) => total + selection.percentage, 0)

// Helper function to transform a single thesis data
export const transformSingleThesis = (
  thesis: ThesisData,
  graderTitles: TitleData[]
) => {
  const mappedStudyTrackId =
    getPrimaryStudyTrackId(thesis.program?.options, thesis.studyTrackId) ||
    thesis.studyTrackId

  const programOptions = thesis.program?.options || {}
  const useIdleState = programOptions.useIdleState === true

  return {
    ...thesis,
    isIdle: useIdleState ? thesis.isIdle : false,
    studyTrackId: mappedStudyTrackId,
    graders: thesis.graders
      .map((grader) => ({
        ...grader,
        title: graderTitles
          .filter((obj) => obj?.username === grader.user.username)[0]
          ?.titles.filter((title) =>
            titlesGraderGroup.includes(title.en.toLowerCase())
          )[0] ?? {
          fi: '',
          en: '',
          sv: '',
        },
        isExternal: grader.user.isExternal,
      }))
      .sort((a, b) => (a.isPrimaryGrader ? -1 : b.isPrimaryGrader ? 1 : 0)),
    supervisions: thesis.supervisions
      .map((supervision) => ({
        ...supervision,
        isExternal: supervision.user.isExternal,
      }))
      .sort((a, b) =>
        a.isPrimarySupervisor
          ? -1
          : b.isPrimarySupervisor
            ? 1
            : a.isExternal
              ? 1
              : -1
      ),
    seminarSupervisions: (thesis.seminarSupervisions ?? [])
      .map((seminarSupervision) => ({
        ...seminarSupervision,
        isExternal: seminarSupervision.user.isExternal,
      }))
      .sort((a, b) => (a.isExternal ? 1 : b.isExternal ? -1 : 0)),
  }
}

// Transforms the raw query data to suitably formatted data for the frontend
export const transformThesisData = (
  thesisData: ThesisData[],
  graderTitles: TitleData[][] // Array of title arrays
) =>
  thesisData.map((thesis, idx) =>
    transformSingleThesis(thesis, graderTitles[idx])
  )

export const getAvailableMilestones = async (
  baseWhere: any,
  bindParams: any
): Promise<number[]> => {
  let canHaveMilestones = true
  if (baseWhere.status) {
    if (Array.isArray(baseWhere.status)) {
      if (!baseWhere.status.includes('IN_PROGRESS')) {
        canHaveMilestones = false
      }
    } else if (baseWhere.status !== 'IN_PROGRESS') {
      canHaveMilestones = false
    }
  }

  if (!canHaveMilestones) return []

  const distinctMilestones = await Thesis.findAll({
    where: {
      ...baseWhere,
      milestone: { [Op.not]: null },
      status: 'IN_PROGRESS',
    },
    attributes: ['milestone'],
    group: ['milestone'],
    raw: true,
    bind: bindParams,
  })

  return distinctMilestones
    .map((t: any) => t.milestone)
    .filter((m) => m !== null && m !== undefined)
    .sort((a, b) => a - b)
}

export const getAvailableActionNeeded = async (
  baseWhere: any,
  bindParams: any
) => {
  const baseAnd = baseWhere[Op.and]
    ? Array.isArray(baseWhere[Op.and])
      ? baseWhere[Op.and]
      : [baseWhere[Op.and]]
    : []

  const [
    hasSuggested,
    hasMissingSecondGrader,
    hasLastMilestone,
    hasEthesisReadyStudentStarted,
  ] = await Promise.all([
    Thesis.findOne({
      where: {
        ...baseWhere,
        [Op.and]: [...baseAnd, { status: 'SUGGESTED' }],
      },
      attributes: ['id'],
      raw: true,
      bind: bindParams,
    }),
    Thesis.findOne({
      where: {
        ...baseWhere,
        [Op.and]: [
          ...baseAnd,
          literal(
            `(SELECT COUNT(*) FROM graders WHERE graders.thesis_id = "Thesis".id) < 2`
          ),
        ],
      },
      attributes: ['id'],
      raw: true,
      bind: bindParams,
    }),
    Thesis.findOne({
      where: {
        ...baseWhere,
        [Op.and]: [
          ...baseAnd,
          { status: 'IN_PROGRESS' },
          literal(
            `(
              (SELECT jsonb_array_length(options->'milestones'->'versions'->CAST(COALESCE("Thesis"."milestone_version", -1) AS int)) FROM "programs" WHERE id = "Thesis"."program_id") > 0
              AND
              "Thesis"."milestone" = (SELECT jsonb_array_length(options->'milestones'->'versions'->CAST(COALESCE("Thesis"."milestone_version", -1) AS int)) FROM "programs" WHERE id = "Thesis"."program_id")
            )`
          ),
        ],
      },
      attributes: ['id'],
      raw: true,
      bind: bindParams,
    }),
    Thesis.findOne({
      where: {
        ...baseWhere,
        [Op.and]: [
          ...baseAnd,
          { status: 'ETHESIS' },
          literal(
            `(SELECT options->>'allowStudentStartedProcess' FROM "programs" WHERE id = "Thesis"."program_id") = 'true'`
          ),
        ],
      },
      attributes: ['id'],
      raw: true,
      bind: bindParams,
    }),
  ])

  return {
    suggested: !!hasSuggested,
    missingSecondGrader: !!hasMissingSecondGrader,
    lastMilestone: !!hasLastMilestone,
    ethesisReadyStudentStarted: !!hasEthesisReadyStudentStarted,
  }
}

const HALF_YEAR = (1000 * 60 * 60 * 24 * 365) / 2
const isWithinLastHalfYear = (date: Date) =>
  date.getTime() > Date.now() - HALF_YEAR

export const calculateThesisStatistics = async (
  theses: ThesisData[]
): Promise<ThesisStatistics[]> => {
  const departments = await Department.findAll({
    attributes: ['id', 'name'],
  })

  const statistics: ThesisStatistics[] = []

  theses.forEach((thesis) => {
    const { status, startDate, targetDate } = thesis
    const targetDateObject = targetDate
      ? new Date(targetDate as string)
      : new Date()
    const startDateObject = new Date(startDate)

    function timeDiff(first: Date, second: Date) {
      return (first.getTime() - second.getTime()) / (1000 * 60 * 60 * 24)
    }

    thesis.supervisions.forEach((supervision) => {
      const { user, isPrimarySupervisor, isExternal } = supervision

      // Ignore external supervisors and missing users
      if (!user || isExternal) return

      const supervisor = statistics.find((s) => s.supervisor.id === user.id)
      if (supervisor) {
        supervisor.statusCounts[status] =
          (supervisor.statusCounts[status] || 0) + 1
        supervisor.startedWithinHalfYearCount += isWithinLastHalfYear(
          new Date(startDate)
        )
          ? 1
          : 0
        supervisor.primarySupervisionsCount +=
          isPrimarySupervisor && status == 'IN_PROGRESS' ? 1 : 0
        supervisor.lateSupervisions.push(
          status != 'COMPLETED' ? timeDiff(new Date(), targetDateObject) : 0
        )
        if (status === 'COMPLETED')
          supervisor.completedSupervisions.push(
            timeDiff(targetDateObject, startDateObject)
          )
      } else {
        const department = departments.find((d) => d.id === user.departmentId)

        statistics.push({
          department,
          supervisor: {
            id: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            departmentId: user.departmentId,
          },
          statusCounts: {
            DRAFT: status === 'DRAFT' ? 1 : 0,
            SUGGESTED: status === 'SUGGESTED' ? 1 : 0,
            PLANNING: status === 'PLANNING' ? 1 : 0,
            IN_PROGRESS: status === 'IN_PROGRESS' ? 1 : 0,
            COMPLETED: status === 'COMPLETED' ? 1 : 0,
            CANCELLED: status === 'CANCELLED' ? 1 : 0,
            ETHESIS_SENT: status === 'ETHESIS_SENT' ? 1 : 0,
            ETHESIS: status === 'ETHESIS' ? 1 : 0,
          },
          startedWithinHalfYearCount: isWithinLastHalfYear(startDateObject)
            ? 1
            : 0,
          primarySupervisionsCount:
            isPrimarySupervisor && status == 'IN_PROGRESS' ? 1 : 0,
          lateSupervisions: [
            status != 'COMPLETED' ? timeDiff(new Date(), targetDateObject) : 0,
          ],
          lateSupervisionsCount: 0,
          avgLateSupervision: 0,
          avgCompletedSupervision: 0,
          completedSupervisions:
            status === 'COMPLETED'
              ? [timeDiff(targetDateObject, startDateObject)]
              : [],
        })
      }
    })
  })

  return statistics.map((supervisor) => {
    const current = {
      ...supervisor,
      lateSupervisions: supervisor.lateSupervisions.filter(
        (x: number) => x > 30
      ),
    }
    current['lateSupervisionsCount'] = current.lateSupervisions.length
    current['avgLateSupervision'] =
      current.lateSupervisions.length > 0
        ? current.lateSupervisions.reduce((a, b) => a + b) /
          current.lateSupervisions.length
        : 0
    current['avgCompletedSupervision'] =
      current.completedSupervisions.length > 0
        ? current.completedSupervisions.reduce((a, b) => a + b) /
          current.completedSupervisions.length
        : 0
    return current
  })
}

export const escapeCsv = (str: unknown) => {
  if (str === null || str === undefined) return ''
  const stringified = String(str)
  return /[",\n]/.test(stringified)
    ? `"${stringified.replace(/"/g, '""')}"`
    : stringified
}

const CSV_COLUMNS = [
  {
    header: 'Program ID',
    getValue: (t: ThesisData) => t.programId,
  },

  { header: 'Topic', getValue: (t: ThesisData) => t.topic },
  { header: 'Status', getValue: (t: ThesisData) => t.status },
  {
    header: 'Start Date',
    getValue: (t: ThesisData) =>
      t.startDate ? dayjs(t.startDate).format('YYYY-MM-DD') : '',
  },
  {
    header: 'Target Date',
    getValue: (t: ThesisData) =>
      t.targetDate ? dayjs(t.targetDate).format('YYYY-MM-DD') : '',
  },
  {
    header: 'Program',
    getValue: (t: ThesisData, lang: string) => {
      const name = t.program?.name
      if (!name) return t.programId
      return (
        name[lang as keyof typeof name] || name.fi || name.en || t.programId
      )
    },
  },
  {
    header: 'Authors',
    getValue: (t: ThesisData) =>
      t.authors?.map((a) => `${a.lastName} ${a.firstName}`).join(', '),
  },
  {
    header: 'Author Student IDs',
    getValue: (t: ThesisData) => {
      const ids = t.authors
        ?.map((a) => a.studentNumber)
        .filter(Boolean)
        .join(', ')
      return ids ? `="${ids}"` : ''
    },
  },
  {
    header: 'Author Emails',
    getValue: (t: ThesisData) =>
      t.authors
        ?.map((a) => a.email)
        .filter(Boolean)
        .join(', '),
  },
  {
    header: 'Supervisors',
    getValue: (t: ThesisData) =>
      t.supervisions
        ?.map((s) => `${s.user?.lastName} ${s.user?.firstName}`)
        .join(', '),
  },
  {
    header: 'Graders',
    getValue: (t: ThesisData) =>
      t.graders
        ?.map((g) => `${g.user?.lastName} ${g.user?.firstName}`)
        .join(', '),
  },
  {
    header: 'Milestone',
    getValue: (t: ThesisData) => t.milestone,
  },
]

export const thesesToCsv = (theses: ThesisData[], language = 'fi') => {
  const headers = CSV_COLUMNS.map((col) => col.header)

  const rows = theses.map((t) =>
    CSV_COLUMNS.map((col) => escapeCsv(col.getValue(t, language)))
  )

  return (
    '\uFEFF' +
    [headers.join(','), ...rows.map((row) => row.join(','))].join('\n')
  )
}
