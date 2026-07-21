import { z } from 'zod'

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

export type PublicUser = z.infer<typeof PublicUserSchema>
