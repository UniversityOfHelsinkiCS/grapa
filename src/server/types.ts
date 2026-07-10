import { GridFilterModel } from '@mui/x-data-grid'
import { Request } from 'express'
import { VALID_EVENT_LOG_TYPES, VALID_THESIS_STATUSES } from '../config'

export interface TranslatedName {
  fi: string
  sv: string
  en: string
}

export type TranslationLanguage = keyof TranslatedName

export interface UserInfo {
  uid: string
  hyPersonSisuId: string
  email: string
  hyGroupCn: string[]
  preferredLanguage: string
  given_name: string
  family_name: string
}

export interface User {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string
  language: string
  isAdmin: boolean
  studentNumber?: string
  iamGroups: string[]
  managedProgramIds?: string[]
  managedStudyTrackIds?: string[]
  approvableProgramIds?: string[]
  managedDepartmentIds?: string[]
  favoriteProgramIds?: string[]
  isExternal: boolean
  hasSeminarSupervisions?: boolean
  affiliation?: string
  departmentId?: string
  thesesTableFilters?: GridFilterModel
  ethesisAdmin?: boolean
  hasStudyRight?: boolean | null
  employeeNumber?: string
}

export interface RequestWithUser extends Request {
  user: User
  loginAs?: boolean
}

export interface TitleData {
  username: string
  titles: TranslatedName[]
}

export type ThesisStatus = (typeof VALID_THESIS_STATUSES)[number]

export interface SupervisionData {
  user: Partial<User>
  percentage: number
  isExternal: boolean
  isPrimarySupervisor: boolean
  creationTimeIdentifier?: string
}

export interface SeminarSupervisionData {
  user: Partial<User>
  isExternal: boolean
  creationTimeIdentifier?: string
}

export interface GraderData {
  user: Partial<User>
  isPrimaryGrader: boolean
  title?: TranslatedName
  isExternal: boolean
}

export interface FileData {
  filename: string
  name: string
  mimetype: string
}

export interface ThesisData {
  milestone?: number
  milestoneVersion?: number
  id?: string
  programId: string
  program?: ProgramData
  studyTrackId?: string
  departmentId?: string
  topic: string
  status: ThesisStatus
  startDate: string
  targetDate?: string
  supervisions: SupervisionData[]
  seminarSupervisions: SeminarSupervisionData[]
  authors: User[]
  approvers: User[]
  graders: GraderData[]
  researchPlan?: FileData | File
  waysOfWorking?: FileData | File
  waysOfWorkingValidUntil?: string | null
  ethesisDate?: string
  isIdle?: boolean
  milestoneOrStatusUpdatedAt?: string | Date | null
}

export interface ThesisStatistics {
  department: DepartmentData
  supervisor: Partial<User>
  statusCounts: Record<ThesisStatus, number>
  startedWithinHalfYearCount: number
  primarySupervisionsCount: number
  lateSupervisions: number[]
  lateSupervisionsCount: number
  avgLateSupervision: number
  avgCompletedSupervision: number
  completedSupervisions: number[]
}

export interface StudyTrackData {
  id: string
  name: TranslatedName
  programId: string
  isManaged?: boolean
}

export interface ProgramData {
  id: string
  name: TranslatedName
  options: Record<string, unknown>
  studyTracks: StudyTrackData[]
  allStudyTracks?: StudyTrackData[]
  isFavorite: boolean
  isManaged: boolean
}

export interface DepartmentData {
  id: string
  name: TranslatedName
}

export interface ServerGetRequest extends Request {
  user: User
}

export interface ServerDeleteRequest extends Request {
  user: User
}

export interface ServerPostRequest extends Request {
  body: ThesisData & {
    researchPlan: Record<string, never>
    waysOfWorking: Record<string, never>
  }
  files: {
    researchPlan: Express.Multer.File[]
    waysOfWorking: Express.Multer.File[]
  }
  user: User
}

export interface ServerPutRequest extends Request {
  body: ThesisData & {
    researchPlan: FileData | Record<string, never>
    waysOfWorking: FileData | Record<string, never>
  }
  files: {
    researchPlan?: Express.Multer.File[]
    waysOfWorking?: Express.Multer.File[]
  }
  user: User
}

export interface ServerThesesFiltersPutRequest extends Request {
  body: {
    thesesTableFilters: Record<string, unknown>[]
  }
  user: User
}

export interface ProgramManagementData {
  userId: string
  programId: string
  isThesisApprover: boolean
  program?: ProgramData
  user?: User
  id?: string
}

export interface DepartmentAdminData {
  userId: string
  departmentId: string
  user?: User
  id?: string
}

export type EventLogType = (typeof VALID_EVENT_LOG_TYPES)[number]
export interface EventLogEntryThesis {
  id: string
  topic: string
  authors?: { firstName: string; lastName: string }[]
}
export interface EventLogEntryUser {
  id: string
  firstName: string
  lastName: string
  email: string
}
export interface EventLogEntry {
  id: string
  type: EventLogType
  // thesisId can be null because this is set to null if a thesis is already deleted,
  // note though that we keep the thesis's data as json in the deletion event.
  // Moving forward, we should conider using soft deletion instead.
  thesisId: string | null
  thesis?: EventLogEntryThesis
  user: EventLogEntryUser
  // some events don't have additional data
  data: any | null
  createdAt: string
}

export interface ThesisCreatedEvent extends EventLogEntry {
  type: 'THESIS_CREATED'
  data: null
}

export interface ThesisDeletedEvent extends EventLogEntry {
  type: 'THESIS_DELETED'
  data: ThesisData
}

export interface SupervisionsChangedEvent extends EventLogEntry {
  type: 'THESIS_SUPERVISIONS_CHANGED'
  data: {
    originalSupervisions: SupervisionData[]
    updatedSupervisions: SupervisionData[]
  }
}

export interface GradersChangedEvent extends EventLogEntry {
  type: 'THESIS_GRADERS_CHANGED'
  data: {
    originalGraders: GraderData[]
    updatedGraders: GraderData[]
  }
}

export interface StatusChangedEvent extends EventLogEntry {
  type: 'THESIS_STATUS_CHANGED'
  data: {
    from: ThesisStatus
    to: ThesisStatus
  }
}
