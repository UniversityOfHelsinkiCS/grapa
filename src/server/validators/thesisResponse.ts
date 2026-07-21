import { z } from 'zod'
import { VALID_EVENT_LOG_TYPES, VALID_THESIS_STATUSES } from '../../config'
import { PublicUserSchema } from './userResponse'
import {
  DepartmentDataSchema,
  TranslatedNameSchema,
} from './departmentResponse'
import { ProgramDataSchema } from './programResponse'

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

// Schemas for event log data
const payloadSchemas: Record<string, z.ZodTypeAny> = {
  THESIS_GRADERS_CHANGED: z
    .object({
      originalGraders: z.array(PublicGraderSchema).optional(),
      updatedGraders: z.array(PublicGraderSchema).optional(),
    })
    .catchall(z.any()),

  THESIS_SUPERVISIONS_CHANGED: z
    .object({
      originalSupervisions: z.array(PublicSupervisionSchema).optional(),
      updatedSupervisions: z.array(PublicSupervisionSchema).optional(),
    })
    .catchall(z.any()),

  THESIS_DELETED: PublicThesisSchema.partial(),

  THESIS_STATUS_CHANGED: z
    .object({
      to: z.string(),
      from: z.string().optional().nullable(),
    })
    .catchall(z.any()),

  THESIS_TOPIC_CHANGED: z
    .object({
      to: z.string(),
      from: z.string().optional().nullable(),
    })
    .catchall(z.any()),
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
