import dayjs from 'dayjs'

export const LATE_THESIS_THRESHOLD_DAYS = 30
export const VERY_LATE_THESIS_THRESHOLD_DAYS = 180

export const getThesisLateDays = (
  targetDate: string | Date | null | undefined
): number => {
  if (!targetDate) return 0

  const difference = dayjs(targetDate).isBefore(dayjs())
    ? dayjs(targetDate).diff(dayjs(), 'day') * -1
    : 0

  return difference
}

export const isThesisLate = (
  targetDate: string | Date | null | undefined
): boolean => {
  return getThesisLateDays(targetDate) >= LATE_THESIS_THRESHOLD_DAYS
}

export const isThesisVeryLate = (
  targetDate: string | Date | null | undefined
): boolean => {
  return getThesisLateDays(targetDate) >= VERY_LATE_THESIS_THRESHOLD_DAYS
}

export const getMilestonesArray = (
  programOptions: any,
  milestoneVersion: number | null | undefined
) => {
  if (!programOptions?.useMilestones) return null
  const versions = programOptions?.milestones?.versions
  if (!versions) return null
  if (milestoneVersion == null) return null

  return versions.at(milestoneVersion) ?? null
}

export const getMilestoneCount = (
  programOptions: any,
  milestoneVersion: number | null | undefined
): number | null => {
  const array = getMilestonesArray(programOptions, milestoneVersion)
  return array ? array.length : null
}

export const hasMilestones = (
  programOptions: any,
  milestoneVersion: number | null | undefined
): boolean => {
  const count = getMilestoneCount(programOptions, milestoneVersion)
  return count != null && count > 0
}

export const getMilestoneValue = (
  programOptions: any,
  milestoneVersion: number | null | undefined,
  milestone: number | null | undefined
) => {
  if (milestone == null || milestone <= 0) return null
  const array = getMilestonesArray(programOptions, milestoneVersion)
  if (!array) return null
  return array[milestone - 1] ?? null
}

export const parseMilestoneDescription = (
  val: any,
  language: string
): string => {
  if (!val) return ''
  return typeof val === 'string'
    ? val
    : val[language as keyof typeof val] || val.fi || ''
}
