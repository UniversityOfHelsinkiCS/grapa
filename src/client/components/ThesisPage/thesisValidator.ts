import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
})

const supervisionSchema = z.object({
  user: userSchema,
  percentage: z.number().min(0).max(100),
})

const graderSchema = z.object({
  user: userSchema,
  isPrimaryGrader: z.boolean(),
})

const fileSchema = z.object({
  name: z.string().min(1, 'Please upload a file'),
})

// Because of Zod's design choices the superrefine is not called when there are other
// issues on the object. This is why the dates are validated separately.
export const ThesisDateSchema = z
  .object({
    startDate: z.string(),
    targetDate: z.string(),
  })
  .superRefine((data, ctx) => {
    if (new Date(data.startDate) > new Date(data.targetDate)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Start date must be before target date',
        path: ['start-date'],
      })
      ctx.addIssue({
        code: 'custom',
        message: 'Target date must be after start date',
        path: ['target-date'],
      })
    }
  })

export const ThesisSchema = z.object({
  programId: z.string(),
  topic: z.string().min(1, 'Please enter the thesis topic'),
  status: z.string().min(1, 'Please select a status for the thesis'),
  supervisions: z
    .array(supervisionSchema)
    .min(1, 'Please select at least one supervisor')
    .refine(
      (supervisions) => {
        const totalPercentage = supervisions.reduce(
          (total, supervision) => total + supervision.percentage,
          0
        )
        return totalPercentage === 100
      },
      {
        message: 'Supervision percentages must add up to 100',
        path: ['percentage'],
      }
    ),
  authors: z.array(userSchema).min(1, 'Please select the author of the thesis'),
  graders: z.array(graderSchema).min(1, 'Please specify at least one grader'),
  researchPlan: fileSchema,
  waysOfWorking: fileSchema,
})

export type ValidatedThesis = z.infer<typeof ThesisSchema>
