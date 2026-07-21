import { z } from 'zod'
import { TranslatedNameSchema } from './departmentResponse'

export const StudyTrackDataSchema = z.object({
  id: z.string(),
  name: TranslatedNameSchema,
  programId: z.string(),
  isManaged: z.boolean().optional(),
})

export const ProgramOptionsSchema = z.record(z.string(), z.any())
export const ProgramDataSchema = z.object({
  id: z.string(),
  name: TranslatedNameSchema,
  options: ProgramOptionsSchema.optional(),
  studyTracks: z.array(StudyTrackDataSchema).optional(),
  allStudyTracks: z.array(StudyTrackDataSchema).optional(),
  isFavorite: z.boolean().optional(),
  isManaged: z.boolean().optional(),
  enabled: z.boolean().optional(),
})

export type StudyTrackData = z.infer<typeof StudyTrackDataSchema>
export type ProgramOptions = z.infer<typeof ProgramOptionsSchema>
export type ProgramData = z.infer<typeof ProgramDataSchema>
