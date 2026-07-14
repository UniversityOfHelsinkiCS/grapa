import { ThesisData as Thesis, User } from '../../server/types'
import { THESIS_STATUSES } from '../../config'

export const isSupervisor = (thesis: Thesis, user: User) =>
  Boolean(user && thesis.supervisions?.some((s) => s.user?.id === user.id))

export const isProgramApprover = (thesis: Thesis, user: User) =>
  Boolean(user && user.approvableProgramIds?.includes(thesis.programId))

export const isStudyTrackManager = (thesis: Thesis, user: User) =>
  Boolean(
    user &&
    thesis.studyTrackId &&
    user.managedStudyTrackIds?.includes(thesis.studyTrackId)
  )

export const hasApprovalRights = (thesis: Thesis, user: User) => {
  const supervisorApprovalEnabled = Boolean(
    thesis.program?.options?.supervisorApproval
  )

  return Boolean(
    user &&
    (isProgramApprover(thesis, user) ||
      (supervisorApprovalEnabled && isSupervisor(thesis, user)))
  )
}

export const canApprove = (thesis: Thesis, user: User) => {
  const isValidStatus =
    thesis.status === THESIS_STATUSES.PLANNING ||
    thesis.status === THESIS_STATUSES.SUGGESTED

  return Boolean(hasApprovalRights(thesis, user) && isValidStatus)
}

export const canSetEthesisMilestones = (thesis: Thesis, user: User) => {
  if (!thesis.program?.options?.useMilestones) return false

  const programMilestones = thesis.program?.options?.milestones?.versions?.at(
    thesis.milestoneVersion != null ? thesis.milestoneVersion : -1
  )
  const milestonesLength = programMilestones?.length || 0

  const isLastMilestone =
    milestonesLength === 0 ||
    thesis.milestone == null ||
    thesis.milestone === milestonesLength

  return Boolean(
    hasApprovalRights(thesis, user) &&
    isLastMilestone &&
    thesis.status === THESIS_STATUSES.IN_PROGRESS
  )
}

export const isStudentDraftActionRequired = (
  thesis: Thesis,
  isStudentView?: boolean
) => {
  return Boolean(isStudentView && thesis.status === THESIS_STATUSES.DRAFT)
}

export const isEthesisReady = (thesis: Thesis) => {
  if (!thesis) return false

  const isBachelor = thesis.program?.options?.isBachelorProgram === true
  return Boolean(
    (isBachelor ? thesis.graders?.length >= 1 : thesis.graders?.length >= 2) &&
    thesis.status === THESIS_STATUSES.IN_PROGRESS
  )
}

export const isMissingGradersActionRequired = (thesis: Thesis, user: User) => {
  return Boolean(
    hasApprovalRights(thesis, user) &&
    thesis.status === THESIS_STATUSES.IN_PROGRESS &&
    !isEthesisReady(thesis)
  )
}

export const isStudentEthesisActionRequired = (
  thesis: Thesis,
  isStudentView?: boolean
) => {
  return Boolean(isStudentView && thesis.status === THESIS_STATUSES.ETHESIS)
}

export const needsStudentAction = (thesis: Thesis, isStudentView?: boolean) => {
  return (
    isStudentDraftActionRequired(thesis, isStudentView) ||
    isStudentEthesisActionRequired(thesis, isStudentView)
  )
}

export const isEthesisAdmin = (user: User) => {
  return Boolean(user && user.ethesisAdmin)
}

export const needsEthesisAdminAction = (thesis: Thesis, user: User) => {
  return isEthesisAdmin(user) && thesis.status === THESIS_STATUSES.ETHESIS_SENT
}
