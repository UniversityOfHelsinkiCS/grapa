import { z } from 'zod'
import { VALID_EVENT_LOG_TYPES, VALID_THESIS_STATUSES } from '../../config'
import { EmployeeUserSchema, StudentUserSchema } from './userResponse'
import {
  DepartmentDataSchema,
  TranslatedNameSchema,
} from './departmentResponse'
import { ProgramDataSchema } from './programResponse'

export const EmployeeSupervisionSchema = z.object({
  user: EmployeeUserSchema.partial(),
  percentage: z.number(),
  isExternal: z.boolean().nullable().optional(),
  isPrimarySupervisor: z.boolean(),
  creationTimeIdentifier: z.string().optional(),
})

export const EmployeeSeminarSupervisionSchema = z.object({
  user: EmployeeUserSchema.partial(),
  isExternal: z.boolean().nullable().optional(),
  creationTimeIdentifier: z.string().optional(),
})

export const EmployeeGraderSchema = z.object({
  user: EmployeeUserSchema.partial(),
  isPrimaryGrader: z.boolean(),
  title: TranslatedNameSchema.optional(),
  isExternal: z.boolean().nullable().optional(),
})

export const FileDataSchema = z.object({
  filename: z.string(),
  name: z.string(),
  mimetype: z.string(),
})

export const EmployeeThesisSchema = z.object({
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
  supervisions: z.array(EmployeeSupervisionSchema).optional().default([]),
  seminarSupervisions: z
    .array(EmployeeSeminarSupervisionSchema)
    .optional()
    .default([]),
  authors: z.array(EmployeeUserSchema).optional().default([]),
  approvers: z.array(EmployeeUserSchema).optional().default([]),
  graders: z.array(EmployeeGraderSchema).optional().default([]),
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

export const PaginatedEmployeeThesesSchema = z.object({
  theses: z.array(EmployeeThesisSchema),
  totalCount: z.number(),
  availableMilestones: z.array(z.number()),
  availableActionNeeded: z.any(), // The service returns an object, not an array
})

export const StudentSupervisionSchema = EmployeeSupervisionSchema.extend({
  user: StudentUserSchema.partial(),
})

export const StudentSeminarSupervisionSchema =
  EmployeeSeminarSupervisionSchema.extend({
    user: StudentUserSchema.partial(),
  })

export const StudentGraderSchema = EmployeeGraderSchema.extend({
  user: StudentUserSchema.partial(),
})

export const StudentThesisSchema = EmployeeThesisSchema.extend({
  supervisions: z.array(StudentSupervisionSchema).optional().default([]),
  seminarSupervisions: z
    .array(StudentSeminarSupervisionSchema)
    .optional()
    .default([]),
  authors: z.array(StudentUserSchema).optional().default([]),
  approvers: z.array(StudentUserSchema).optional().default([]),
  graders: z.array(StudentGraderSchema).optional().default([]),
})

export const PaginatedStudentThesesSchema =
  PaginatedEmployeeThesesSchema.extend({
    theses: z.array(StudentThesisSchema),
  })

export const ThesisStatisticsSchema = z.object({
  department: DepartmentDataSchema.optional(),
  supervisor: EmployeeUserSchema.partial(),
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

const BaseEventLogSchema = z.object({
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

export const GradersChangedEventSchema = z
  .object({
    originalGraders: z.array(EmployeeGraderSchema).optional(),
    updatedGraders: z.array(EmployeeGraderSchema).optional(),
  })
  .catchall(z.any())

export const SupervisionsChangedEventSchema = z
  .object({
    originalSupervisions: z.array(EmployeeSupervisionSchema).optional(),
    updatedSupervisions: z.array(EmployeeSupervisionSchema).optional(),
  })
  .catchall(z.any())

export const StatusChangedEventSchema = z
  .object({
    to: z.string(),
    from: z.string().optional().nullable(),
  })
  .catchall(z.any())

export const TopicChangedEventSchema = z
  .object({
    to: z.string(),
    from: z.string().optional().nullable(),
  })
  .catchall(z.any())

// Schemas for event log data
const payloadSchemas: Record<string, z.ZodTypeAny> = {
  THESIS_GRADERS_CHANGED: GradersChangedEventSchema,
  THESIS_SUPERVISIONS_CHANGED: SupervisionsChangedEventSchema,
  THESIS_DELETED: EmployeeThesisSchema.partial(),
  THESIS_STATUS_CHANGED: StatusChangedEventSchema,
  THESIS_TOPIC_CHANGED: TopicChangedEventSchema,
}

export const EventLogSchema = BaseEventLogSchema.transform((log) => {
  if (!log.data) return log

  const schema = payloadSchemas[log.type]

  // No schema defined for this event type, drop the data.
  if (!schema) {
    return { ...log, data: null }
  }

  const parsed = schema.safeParse(log.data)

  return {
    ...log,
    data: parsed.success ? parsed.data : null, // Drops data if validation fails
  }
})

export type ThesisData = z.infer<typeof EmployeeThesisSchema>
export type ThesisStatistics = z.infer<typeof ThesisStatisticsSchema>
export type EventLogEntry = z.infer<typeof EventLogSchema>
export type SupervisionData = z.infer<typeof EmployeeSupervisionSchema>
export type SeminarSupervisionData = z.infer<
  typeof EmployeeSeminarSupervisionSchema
>
export type GraderData = z.infer<typeof EmployeeGraderSchema>
export type FileData = z.infer<typeof FileDataSchema>
export type EventLogEntryThesis = z.infer<typeof EventLogEntryThesisSchema>
export interface GradersChangedEvent extends Omit<EventLogEntry, 'data'> {
  type: 'THESIS_GRADERS_CHANGED'
  data: z.infer<typeof GradersChangedEventSchema>
}
export interface SupervisionsChangedEvent extends Omit<EventLogEntry, 'data'> {
  type: 'THESIS_SUPERVISIONS_CHANGED'
  data: z.infer<typeof SupervisionsChangedEventSchema>
}
export interface StatusChangedEvent extends Omit<EventLogEntry, 'data'> {
  type: 'THESIS_STATUS_CHANGED'
  data: z.infer<typeof StatusChangedEventSchema>
}
export interface TopicChangedEvent extends Omit<EventLogEntry, 'data'> {
  type: 'THESIS_TOPIC_CHANGED'
  data: z.infer<typeof TopicChangedEventSchema>
}
export interface ThesisCreatedEvent extends Omit<EventLogEntry, 'data'> {
  type: 'THESIS_CREATED'
  data: z.infer<typeof EmployeeThesisSchema>
}

export type ThesisStatus = (typeof VALID_THESIS_STATUSES)[number]
