import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'

export type ErrorPath = (string | number)[]

export interface ThesisFormErrors {
  issues: z.core.$ZodIssue[]
  at: (...path: ErrorPath) => z.core.$ZodIssue[]
  set: (issues: z.core.$ZodIssue[]) => void
  clear: (...path: ErrorPath) => void
  has: (...path: ErrorPath) => boolean
  message: (...path: ErrorPath) => string | undefined
  fieldProps: (...path: ErrorPath) => { error: boolean; helperText?: string }
}

const isUnder = (issuePath: readonly PropertyKey[], path: ErrorPath) =>
  path.every((segment, index) => issuePath[index] === segment)

export const useThesisFormErrors = (): ThesisFormErrors => {
  const { t } = useTranslation()
  const [issues, setIssues] = useState<z.core.$ZodIssue[]>([])

  const at = (...path: ErrorPath) =>
    issues.filter((issue) => isUnder(issue.path, path))

  const message = (...path: ErrorPath) => {
    const [issue] = at(...path)

    return issue ? t(issue.message) : undefined
  }

  return {
    issues,
    at,
    message,
    set: setIssues,
    clear: (...path) =>
      setIssues((current) =>
        current.filter((issue) => !isUnder(issue.path, path))
      ),
    has: (...path) => at(...path).length > 0,
    fieldProps: (...path) => ({
      error: at(...path).length > 0,
      helperText: message(...path),
    }),
  }
}
