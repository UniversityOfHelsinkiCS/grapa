import { Request } from 'express'

export interface TranslatedName {
  fi: string
  en: string
  sv: string
}

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
  iamGroups: string[]
}

export interface RequestWithUser extends Request {
  user: User
}

export type ThesisStatus =
  | 'PLANNING'
  | 'STARTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'

export interface SupervisionData {
  user: AuthorData
  percentage: number
  external: boolean
}

export interface AuthorData {
  id: string
  username: string
  firstName: string
  lastName: string
  email: string | null
}

export interface GraderData {
  user: AuthorData
  isPrimaryGrader: boolean
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
  topic: string
  status: ThesisStatus
  startDate: string
  targetDate?: string
  supervisions: SupervisionData[]
  authors: AuthorData[]
  graders: GraderData[]
  researchPlan?: FileData | File
  waysOfWorking?: FileData | File
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
}

export interface ServerGetRequest extends Request {
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
}
