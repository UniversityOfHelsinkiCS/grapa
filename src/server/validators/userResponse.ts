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
