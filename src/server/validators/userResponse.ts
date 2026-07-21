import { z } from 'zod'

export const StudentUserSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable().optional(),
})

export type StudentUser = z.infer<typeof StudentUserSchema>

export const EmployeeUserSchema = StudentUserSchema.extend({
  affiliation: z.string().nullable().optional(),
  isExternal: z.boolean(),
  studentNumber: z.string().nullable().optional(),
})

export type EmployeeUser = z.infer<typeof EmployeeUserSchema>

export const LoggedInUserSchema = EmployeeUserSchema.extend({
  isAdmin: z.boolean().optional(),
  iamGroups: z.array(z.string()).optional(),
  language: z.string().optional(),
  departmentId: z.string().optional().nullable(),
  thesesTableFilters: z.any().optional(),
  ethesisAdmin: z.boolean().optional(),
  managedProgramIds: z.array(z.string()).optional(),
  managedStudyTrackIds: z.array(z.string()).optional(),
  approvableProgramIds: z.array(z.string()).optional(),
  managedDepartmentIds: z.array(z.string()).optional(),
  favoriteProgramIds: z.array(z.string()).optional(),
  hasSeminarSupervisions: z.boolean().optional(),
  hasStudyRight: z.boolean().optional(),
})

export type LoggedInUser = z.infer<typeof LoggedInUserSchema>
