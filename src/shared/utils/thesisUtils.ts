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
