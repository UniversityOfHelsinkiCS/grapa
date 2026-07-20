import { z } from 'zod'
import { VALID_EVENT_LOG_TYPES, VALID_THESIS_STATUSES } from '../../config'

export const TranslatedNameSchema = z.object({
  fi: z.string(),
  sv: z.string(),
  en: z.string(),
})

export const PublicUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable().optional(),
  affiliation: z.string().nullable().optional(),
  isExternal: z.boolean(),
  studentNumber: z.string().nullable().optional(),
})

export const DepartmentDataSchema = z.object({
  id: z.string(),
  name: TranslatedNameSchema,
})

export const StudyTrackDataSchema = z.object({
  id: z.string(),
  name: TranslatedNameSchema,
  programId: z.string(),
  isManaged: z.boolean().optional(),
})

export const ProgramOptionsSchema = z
  .object({
    seminar: z.boolean().optional(),
    allowMultipleSeminarResponsibles: z.boolean().optional(),
    allowStudentStartedProcess: z.boolean().optional(),
    waysOfWorkingRequired: z.boolean().optional(),
    allowMultipleAuthors: z.boolean().optional(),
    hideSendToEthesis: z.boolean().optional(),
    useMilestones: z.boolean().optional(),
    disableStudyTracks: z.boolean().optional(),
    useIdleState: z.boolean().optional(),
    supervisorApproval: z.boolean().optional(),
    thesisProgramManagerNotRequired: z.boolean().optional(),
    isBachelorProgram: z.boolean().optional(),
    numberOfGraders: z.number().optional(),
    milestones: z
      .object({
        versions: z.array(z.array(z.any())).optional(),
      })
      .optional(),
    combinedStudyTracks: z.record(z.string(), z.string()).optional(),
  })
  .catchall(z.any())

export const ProgramDataSchema = z.object({
  id: z.string(),
  name: TranslatedNameSchema,
  options: ProgramOptionsSchema.optional(),
  studyTracks: z.array(StudyTrackDataSchema).optional(),
  allStudyTracks: z.array(StudyTrackDataSchema).optional(),
  isFavorite: z.boolean().optional(),
  isManaged: z.boolean().optional(),
})

export const PublicSupervisionSchema = z.object({
  user: PublicUserSchema.partial(),
  percentage: z.number(),
  isExternal: z.boolean().nullable().optional(),
  isPrimarySupervisor: z.boolean(),
  creationTimeIdentifier: z.string().optional(),
})

export const PublicSeminarSupervisionSchema = z.object({
  user: PublicUserSchema.partial(),
  isExternal: z.boolean().nullable().optional(),
  creationTimeIdentifier: z.string().optional(),
})

export const PublicGraderSchema = z.object({
  user: PublicUserSchema.partial(),
  isPrimaryGrader: z.boolean(),
  title: TranslatedNameSchema.optional(),
  isExternal: z.boolean().nullable().optional(),
})

export const FileDataSchema = z.object({
  filename: z.string(),
  name: z.string(),
  mimetype: z.string(),
})

export const PublicThesisSchema = z.object({
  id: z.string().optional(),
  milestone: z.number().optional().nullable(),
  milestoneVersion: z.number().optional().nullable(),
  programId: z.string(),
  program: ProgramDataSchema.optional(),
  studyTrackId: z.string().nullable().optional(),
  departmentId: z.string().nullable().optional(),
  topic: z.string(),
  status: z.enum(VALID_THESIS_STATUSES),
  startDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val).toISOString()),
  targetDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val).toISOString())
    .optional()
    .nullable(),
  supervisions: z.array(PublicSupervisionSchema).optional().default([]),
  seminarSupervisions: z
    .array(PublicSeminarSupervisionSchema)
    .optional()
    .default([]),
  authors: z.array(PublicUserSchema).optional().default([]),
  approvers: z.array(PublicUserSchema).optional().default([]),
  graders: z.array(PublicGraderSchema).optional().default([]),
  researchPlan: z.any().optional(), // Could be FileData or File, hard to parse precisely here
  waysOfWorking: z.any().optional(),
  waysOfWorkingValidUntil: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val).toISOString())
    .optional()
    .nullable(),
  ethesisDate: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val).toISOString())
    .optional()
    .nullable(),
  isIdle: z.boolean().optional(),
  milestoneOrStatusUpdatedAt: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val).toISOString())
    .optional()
    .nullable(),
})

export const PaginatedThesesSchema = z.object({
  theses: z.array(PublicThesisSchema),
  totalCount: z.number(),
  availableMilestones: z.array(z.number()),
  availableActionNeeded: z.any(), // The service returns an object, not an array
})

export const ThesisStatisticsSchema = z.object({
  department: DepartmentDataSchema.optional(),
  supervisor: PublicUserSchema.partial(),
  statusCounts: z.record(z.enum(VALID_THESIS_STATUSES), z.number()),
  startedWithinHalfYearCount: z.number(),
  primarySupervisionsCount: z.number(),
  lateSupervisions: z.array(z.number()),
  lateSupervisionsCount: z.number(),
  avgLateSupervision: z.number(),
  avgCompletedSupervision: z.number(),
  completedSupervisions: z.array(z.number()),
})

export const EventLogEntryThesisSchema = z.object({
  id: z.string(),
  topic: z.string(),
  authors: z
    .array(z.object({ firstName: z.string(), lastName: z.string() }))
    .optional(),
})

export const EventLogEntryUserSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
})

export const EventLogSchema = z.object({
  id: z.string(),
  type: z.enum(VALID_EVENT_LOG_TYPES),
  thesisId: z.string().nullable(),
  userId: z.string().nullable(),
  data: z.any(),
  createdAt: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val).toISOString()),
  user: EventLogEntryUserSchema.optional().nullable(),
  thesis: EventLogEntryThesisSchema.optional().nullable(),
})
