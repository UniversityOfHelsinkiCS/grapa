import { ThesisData as Thesis, User } from '../../server/types'
import { THESIS_STATUSES } from '../../config'

export const isSupervisor = (thesis: Thesis, user: User) =>
  Boolean(user && thesis.supervisions?.some((s) => s.user?.id === user.id))

export const isProgramApprover = (thesis: Thesis, user: User) =>
  Boolean(user && user.approvableProgramIds?.includes(thesis.programId))

export const canApprove = (thesis: Thesis, user: User) => {
  const supervisorApprovalEnabled = Boolean(
    thesis.program?.options?.supervisorApproval
  )

  const isValidStatus =
    thesis.status === THESIS_STATUSES.PLANNING ||
    thesis.status === THESIS_STATUSES.SUGGESTED

  return Boolean(
    user &&
    isValidStatus &&
    (isProgramApprover(thesis, user) ||
      (supervisorApprovalEnabled && isSupervisor(thesis, user)))
  )
}

export const canSetEthesisStudentStarted = (thesis: Thesis, user: User) => {
  const programMilestones = thesis.program?.options?.milestones?.versions?.at(
    thesis.milestoneVersion != null ? thesis.milestoneVersion : -1
  )
  const milestonesLength = programMilestones?.length || 0

  const isLastMilestone =
    milestonesLength === 0 ||
    thesis.milestone == null ||
    thesis.milestone === milestonesLength

  return Boolean(
    isSupervisor(thesis, user) &&
    isLastMilestone &&
    thesis.status === THESIS_STATUSES.IN_PROGRESS
  )
}

export const needsStudentAction = (thesis: Thesis, isStudentView?: boolean) => {
  return Boolean(
    isStudentView &&
    (thesis.status === THESIS_STATUSES.DRAFT ||
      thesis.status === THESIS_STATUSES.ETHESIS)
  )
}
