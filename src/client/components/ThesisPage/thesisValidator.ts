import { uniqBy } from 'lodash-es'
import { z } from 'zod'
import { ThesisData } from '@backend/validators/thesisResponse'

const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
})

const extUserSchema = z.object({
  firstName: z
    .string({ message: 'formErrors:firstName' })
    .min(1, 'formErrors:firstName'),
  lastName: z
    .string({ message: 'formErrors:lastName' })
    .min(1, 'formErrors:lastName'),
  email: z.email({ message: 'formErrors:email' }),
  affiliation: z
    .string({ message: 'formErrors:affiliation' })
    .min(1, 'formErrors:affiliation'),
})

export const getPersonSelectionDefaults = (
  type: 'supervisor' | 'grader' | 'seminarSupervisor',
  index: number,
  totalLength: number = 1
) => {
  return {
    isExternal: false,
    ...(type === 'supervisor' && {
      isPrimarySupervisor: index === 0,
      percentage: totalLength <= 1 ? 100 : 0,
    }),
    ...(type === 'grader' && {
      isPrimaryGrader: index === 0,
    }),
  }
}

const supervisionSchema = z
  .object({
    user: z.looseObject({}).nullable(),
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
      const userData = data.user ?? {
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
      }

      extUserSchema.safeParse(userData).error?.issues.forEach((issue) => {
        ctx.addIssue({
          ...issue,
          path: ['user', ...issue.path],
        })
      })
    }
  })

const seminarSupervisionSchema = z
  .object({
    user: z.looseObject({}).nullable(),
    isExternal: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.user) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:seminarSupervisors',
        path: ['user'],
      })
    }
  })

const graderSchema = z
  .object({
    user: z.looseObject({}).nullable(),
    isPrimaryGrader: z.boolean(),
    isExternal: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.isExternal && !data.user) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:graders',
        path: ['user'],
      })
    }

    if (data.isExternal) {
      const userData = data.user ?? {
        firstName: '',
        lastName: '',
        email: '',
        affiliation: '',
      }

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
    startDate: z.string().min(1, 'formErrors:startDate'),
    targetDate: z.string().min(1, 'formErrors:targetDate'),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate)
    const target = new Date(data.targetDate)

    const isStartInvalid = isNaN(start.getTime())
    const isTargetInvalid = isNaN(target.getTime())

    if (data.startDate.length > 0 && isStartInvalid) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:startDate',
        path: ['startDate'],
      })
    }

    if (data.targetDate.length > 0 && isTargetInvalid) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:targetDate',
        path: ['targetDate'],
      })
    }

    if (!isStartInvalid && !isTargetInvalid && start >= target) {
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
  approvers: z.array(userSchema).optional(),
  status: z.string().min(1, 'formErrors:status'),
  supervisions: z.array(supervisionSchema).superRefine((supervisions, ctx) => {
    const totalPercentage = supervisions.reduce(
      (total, supervision) => total + supervision.percentage,
      0
    )

    if (supervisions.length == 0) return

    if (totalPercentage !== 100) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:supervisorPercentage',
        path: ['general'],
      })
    }

    if (
      !supervisions.some(
        (supervisor) => supervisor.isPrimarySupervisor && !supervisor.isExternal
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:primarySupervisor',
        path: ['general'],
      })
    }

    const nonDuplicateSupervisors = uniqBy(
      supervisions,
      (sup) => sup.user?.email
    )

    if (nonDuplicateSupervisors.length !== supervisions.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:duplicateSupervisorEmails',
        path: ['general'],
      })
    }
  }),
  seminarSupervisions: z
    .array(seminarSupervisionSchema)
    .superRefine((seminarSupervisions, ctx) => {
      if (seminarSupervisions.some((supervision) => supervision.isExternal)) {
        ctx.addIssue({
          code: 'custom',
          message: 'formErrors:seminarSupervisorInternalOnly',
          path: ['general'],
        })
      }
    })
    .default([]),
  graders: z.array(graderSchema).superRefine((graders, ctx) => {
    const nonDuplicateGraders = uniqBy(graders, (grader) => grader.user?.email)

    if (nonDuplicateGraders.length !== graders.length) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:duplicateGraderEmails',
        path: ['general'],
      })
    }
  }),
  researchPlan: z.any().refine((value) => value && value.name, {
    message: 'formErrors:researchPlan',
  }),
})

export type ValidatedThesis = z.infer<typeof ThesisSchema>

export interface GetFormErrorsOptions {
  hasApprovers?: boolean
  seminarSupervisionRequired?: boolean
  allowMultipleSeminarResponsibles?: boolean
  waysOfWorkingRequired?: boolean
  isStudentView?: boolean
  supervisionRequired?: boolean
  gradersRequired?: boolean
}

// We use z.any().superRefine(...) so it ALWAYS evaluates, meaning we can collect
// ALL errors (base schema, date schema, and dynamic logic) without Zod short-circuiting.
export const createThesisSchema = (options: GetFormErrorsOptions = {}) => {
  const {
    hasApprovers = false,
    seminarSupervisionRequired = false,
    allowMultipleSeminarResponsibles = false,
    waysOfWorkingRequired = false,
    isStudentView = false,
    supervisionRequired = false,
    gradersRequired = true,
  } = options

  return z.custom<Partial<ThesisData>>().superRefine((thesis, ctx) => {
    // 1. Run base schema
    const baseResult = ThesisSchema.safeParse(thesis)
    if (!baseResult.success) {
      baseResult.error.issues.forEach((issue) =>
        ctx.addIssue(issue as z.core.$ZodRawIssue)
      )
    }

    // 2. Run date schema
    const dateResult = ThesisDateSchema.safeParse({
      startDate: thesis?.startDate || '',
      targetDate: thesis?.targetDate || '',
    })
    if (!dateResult.success) {
      dateResult.error.issues.forEach((issue) =>
        ctx.addIssue(issue as z.core.$ZodRawIssue)
      )
    }

    // 3. Dynamic rules
    if (
      !isStudentView &&
      gradersRequired &&
      (!thesis?.graders || thesis.graders.length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:graders',
        path: ['graders', 'general'],
      })
    }

    if (
      seminarSupervisionRequired &&
      (!thesis?.seminarSupervisions || thesis.seminarSupervisions.length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:seminarSupervisorRequired',
        path: ['seminarSupervisions', 'general'],
      })
    }

    if (
      supervisionRequired &&
      (!thesis?.supervisions || thesis.supervisions.length === 0)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:supervisors',
        path: ['supervisions', 'general'],
      })
    }

    if (
      !allowMultipleSeminarResponsibles &&
      thesis?.seminarSupervisions &&
      thesis.seminarSupervisions.length > 1
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:singleSeminarSupervisor',
        path: ['seminarSupervisions', 'general'],
      })
    }

    // Add custom validation for approvers when they are available
    if (
      !isStudentView &&
      hasApprovers &&
      (!thesis?.approvers ||
        thesis.approvers.length === 0 ||
        !thesis.approvers[0])
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:approver',
        path: ['approvers'],
      })
    }

    if (
      waysOfWorkingRequired &&
      (!(thesis as any)?.waysOfWorking || !(thesis as any).waysOfWorking.name)
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:waysOfWorking',
        path: ['waysOfWorking'],
      })
    }

    const hasWaysOfWorkingFile =
      (thesis as any)?.waysOfWorking && (thesis as any).waysOfWorking.name
    if (
      (waysOfWorkingRequired || hasWaysOfWorkingFile) &&
      !(thesis as any)?.waysOfWorkingValidUntil
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'formErrors:waysOfWorkingValidUntil',
        path: ['waysOfWorkingValidUntil'],
      })
    }
  })
}
