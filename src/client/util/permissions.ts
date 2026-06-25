import { ThesisData as Thesis, User } from '../../server/types'
import { THESIS_STATUSES } from '../../config'

export const isSupervisor = (thesis: Thesis, user: User) =>
  Boolean(user && thesis.supervisions?.some((s) => s.user?.id === user.id))

export const isApprover = (thesis: Thesis, user: User) =>
  Boolean(
    user && thesis.approvers?.length && thesis.approvers[0].id === user.id
  )

export const canApprove = (thesis: Thesis, user: User) =>
  Boolean(
    user &&
    ((thesis.status === THESIS_STATUSES.PLANNING && isApprover(thesis, user)) ||
      (thesis.status === THESIS_STATUSES.SUGGESTED &&
        isSupervisor(thesis, user)))
  )

export const canSetEthesisStudentStarted = (thesis: Thesis, user: User) => {
  const programMilestones = thesis.program?.options?.milestones?.versions?.at(
    thesis.milestoneVersion != null ? thesis.milestoneVersion : -1
  )
  const milestonesLength = programMilestones?.length || 0

  const isLastMilestone =
    thesis.milestone !== undefined && thesis.milestone === milestonesLength

  return Boolean(
    isSupervisor(thesis, user) &&
    isLastMilestone &&
    thesis.status === THESIS_STATUSES.IN_PROGRESS
  )
}
