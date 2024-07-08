import { z } from 'zod'

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
})

const extUserSchema = z.object({
  firstName: z
    .string({ required_error: 'formErrors:firstName' })
    .min(1, 'formErrors:firstName'),
  lastName: z
    .string({ required_error: 'formErrors:lastName' })
    .min(1, 'formErrors:lastName'),
  email: z
    .string({ required_error: 'formErrors:email' })
    .email('formErrors:email'),
})

const supervisionSchema = z
  .object({
    user: z.object({}).passthrough().nullable(),
    percentage: z.number().min(0).max(100),
    isExternal: z.boolean(),
    isPrimarySupervisor: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isExternal && !data.user) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:supervisors',
        path: ['user'],
      })
    }

    if (data.isExternal) {
      const userData = data.user ?? { firstName: '', lastName: '', email: '' }

      extUserSchema.safeParse(userData).error?.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ['user', ...issue.path],
        })
      })
    }
  })

const graderSchema = z
  .object({
    user: z.object({}).passthrough().nullable(),
    isPrimaryGrader: z.boolean(),
    isExternal: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isExternal && data.isPrimaryGrader && !data.user) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:graders',
        path: ['user'],
      })
    }

    if (data.isExternal) {
      const userData = data.user ?? { firstName: '', lastName: '', email: '' }

      extUserSchema.safeParse(userData).error?.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ['user', ...issue.path],
        })
      })
    }
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
        message: 'formErrors:startDate',
        path: ['startDate'],
      })
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:targetDate',
        path: ['targetDate'],
      })
    }
  })

export const ThesisSchema = z.object({
  topic: z.string().min(1, 'formErrors:topic'),
  programId: z.string().min(1, 'formErrors:program'),
  authors: z.array(userSchema).min(1, 'formErrors:authors'),
  status: z.string().min(1, 'formErrors:status'),
  supervisions: z
    .array(supervisionSchema)
    .refine(
      (supervisions) => {
        const totalPercentage = supervisions.reduce(
          (total, supervision) => total + supervision.percentage,
          0
        )
        return totalPercentage === 100
      },
      {
        message: 'formErrors:supervisorPercentage',
        path: ['percentage'],
      }
    )
    .refine(
      (supervisors) =>
        supervisors.some((supervisor) => supervisor.isPrimarySupervisor),
      {
        message: 'formErrors:primarySupervisor',
        path: ['missingPrimarySupervisor'],
      }
    ),
  graders: z.array(graderSchema),
  researchPlan: z
    .object({
      name: z.string().min(1, 'formErrors:researchPlan'),
    })
    .optional()
    .refine((value) => value !== undefined, {
      message: 'formErrors:researchPlan',
    }),
  waysOfWorking: z
    .object({
      name: z.string().min(1, 'formErrors:waysOfWorking'),
    })
    .optional()
    .refine((value) => value !== undefined, {
      message: 'formErrors:waysOfWorking',
    }),
})

export type ValidatedThesis = z.infer<typeof ThesisSchema>
