import { GridFilterModel } from '@mui/x-data-grid'
import { Request } from 'express'
import { VALID_EVENT_LOG_TYPES } from 'src/config'

export interface TranslatedName {
  fi: string
  en: string
  sv: string
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
  approvableProgramIds?: string[]
  managedDepartmentIds?: string[]
  favoriteProgramIds?: string[]
  isExternal: boolean
  affiliation?: string
  departmentId?: string
  thesesTableFilters?: GridFilterModel
}

export interface RequestWithUser extends Request {
  user: User
  loginAs?: boolean
}

export type ThesisStatus =
  | 'PLANNING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface SupervisionData {
  user: Partial<User>
  percentage: number
  isExternal: boolean
  isPrimarySupervisor: boolean
  creationTimeIdentifier?: string
}

export interface GraderData {
  user: Partial<User>
  isPrimaryGrader: boolean
  isExternal: boolean
}

export interface FileData {
  filename: string
  name: string
  mimetype: string
}

export interface ThesisData {
  id?: string
  programId: string
  studyTrackId?: string
  departmentId?: string
  topic: string
  status: ThesisStatus
  startDate: string
  targetDate?: string
  supervisions: SupervisionData[]
  authors: User[]
  approvers: User[]
  graders: GraderData[]
  researchPlan?: FileData | File
  waysOfWorking?: FileData | File
}

export interface ThesisStatistics {
  department: DepartmentData
  supervisor: Partial<User>
  statusCounts: Record<ThesisStatus, number>
}

export interface StudyTrackData {
  id: string
  name: TranslatedName
  programId: string
}

export interface ProgramData {
  id: string
  name: TranslatedName
  studyTracks: StudyTrackData[]
  isFavorite: boolean
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
