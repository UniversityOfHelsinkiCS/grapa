import dayjs from 'dayjs'
import type { ProgramOptions } from '@backend/types'

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

export const programHasMilestones = (
  programOptions: ProgramOptions | null | undefined
): boolean => {
  return Boolean(
    programOptions?.useMilestones &&
    programOptions?.milestones?.versions &&
    programOptions.milestones.versions.length > 0
  )
}

export const getMilestonesArray = (
  programOptions: ProgramOptions | null | undefined,
  milestoneVersion: number | null | undefined
) => {
  if (!programHasMilestones(programOptions)) return null
  if (milestoneVersion == null || milestoneVersion < 0) return null

  return programOptions!.milestones!.versions.at(milestoneVersion) ?? null
}

export const getMilestoneCount = (
  programOptions: ProgramOptions | null | undefined,
  milestoneVersion: number | null | undefined
): number | null => {
  const array = getMilestonesArray(programOptions, milestoneVersion)
  return array ? array.length : null
}

export const hasMilestones = (
  programOptions: ProgramOptions | null | undefined,
  milestoneVersion: number | null | undefined
): boolean => {
  const count = getMilestoneCount(programOptions, milestoneVersion)
  return count != null && count > 0
}

export const getMilestoneValue = (
  programOptions: ProgramOptions | null | undefined,
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

export const getDefaultMilestoneVersionIndex = (
  programOptions: ProgramOptions | null | undefined
): number => {
  if (!programHasMilestones(programOptions)) return -1
  return programOptions!.milestones!.versions.length - 1
}

export const resolveMilestoneVersionIndex = (
  currentMilestoneVersion: number | null | undefined,
  programOptions: ProgramOptions | null | undefined
): number => {
  if (currentMilestoneVersion === null) return -1
  if (currentMilestoneVersion !== undefined) return currentMilestoneVersion
  return getDefaultMilestoneVersionIndex(programOptions)
}
