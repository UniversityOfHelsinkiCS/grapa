import { z } from 'zod'
import { TranslatedNameSchema } from './departmentResponse'

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
  enabled: z.boolean().optional(),
})

export type StudyTrackData = z.infer<typeof StudyTrackDataSchema>
export type ProgramOptions = z.infer<typeof ProgramOptionsSchema>
export type ProgramData = z.infer<typeof ProgramDataSchema>
