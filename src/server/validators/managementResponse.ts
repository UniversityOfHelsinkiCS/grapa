import { z } from 'zod'
import { EmployeeUserSchema } from './userResponse'
import { DepartmentDataSchema } from './departmentResponse'
import { ProgramDataSchema, StudyTrackDataSchema } from './programResponse'

export const DepartmentAdminResponseSchema = z.object({
  id: z.string().optional(),
  departmentId: z.string(),
  userId: z.string(),
  user: EmployeeUserSchema.optional(),
  department: DepartmentDataSchema.optional(),
})

export const ProgramManagementResponseSchema = z.object({
  id: z.string().optional(),
  programId: z.string(),
  userId: z.string(),
  isThesisApprover: z.boolean().optional(),
  user: EmployeeUserSchema.optional(),
  program: ProgramDataSchema.optional(),
})

export const StudyTrackManagementResponseSchema = z.object({
  id: z.string().optional(),
  studyTrackId: z.string(),
  userId: z.string(),
  user: EmployeeUserSchema.optional(),
  studyTrack: StudyTrackDataSchema.optional(),
})

export const EthesisAdminResponseSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  user: EmployeeUserSchema.optional(),
})

export type DepartmentAdminData = z.infer<typeof DepartmentAdminResponseSchema>
export type ProgramManagementData = z.infer<
  typeof ProgramManagementResponseSchema
>
export type StudyTrackManagementData = z.infer<
  typeof StudyTrackManagementResponseSchema
>
export type EthesisAdminData = z.infer<typeof EthesisAdminResponseSchema>
