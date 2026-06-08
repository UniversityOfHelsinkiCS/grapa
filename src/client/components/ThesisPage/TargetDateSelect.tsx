import { useState } from 'react'
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'

interface TargetDateSelectProps {
  targetDates: { value: string }[]
  targetDate?: string
  startDate?: string
  formErrors: ZodIssue[]
  onChange: (date: string) => void
  onClearError: () => void
}

const TargetDateSelect = ({
  targetDates,
  targetDate,
  startDate,
  formErrors,
  onChange,
  onClearError,
}: TargetDateSelectProps) => {
  const { t } = useTranslation()
  const [forceCustomTargetDate, setForceCustomTargetDate] = useState(false)

  const hasTargetDates = targetDates.length > 0
  const isPredefinedTargetDate = targetDates.some(
    (td) => td.value === targetDate
  )
  const targetDateDropdownValue = hasTargetDates
    ? forceCustomTargetDate || (!isPredefinedTargetDate && targetDate)
      ? 'custom'
      : isPredefinedTargetDate
        ? targetDate
        : ''
    : 'custom'

  return (
    <>
      {hasTargetDates && (
        <FormControl
          fullWidth
          sx={{ mb: targetDateDropdownValue === 'custom' ? 2 : 0 }}
        >
          <InputLabel id="target-date-select-label">
            {t('targetDateHeader')}
          </InputLabel>
          <Select
            labelId="target-date-select-label"
            id="target-date-select"
            value={targetDateDropdownValue}
            label={t('targetDateHeader')}
            onChange={(event) => {
              const value = event.target.value
              if (value === 'custom') {
                setForceCustomTargetDate(true)
              } else {
                setForceCustomTargetDate(false)
                onChange(value)
                onClearError()
              }
            }}
            error={
              formErrors.some((error) => error.path[0] === 'targetDate') &&
              targetDateDropdownValue !== 'custom'
            }
          >
            {targetDates.map((td, index) => (
              <MenuItem key={index} value={td.value}>
                {dayjs(td.value).format('DD.MM.YYYY')}
              </MenuItem>
            ))}
            <MenuItem value="custom">{t('thesisForm:customDate')}</MenuItem>
          </Select>
          {targetDateDropdownValue !== 'custom' && (
            <FormHelperText
              error={formErrors.some((error) => error.path[0] === 'targetDate')}
            >
              {t(
                formErrors.find((error) => error.path[0] === 'targetDate')
                  ?.message
              ) || 'DD.MM.YYYY'}
            </FormHelperText>
          )}
        </FormControl>
      )}

      {(!hasTargetDates || targetDateDropdownValue === 'custom') && (
        <DatePicker
          label={
            hasTargetDates ? t('thesisForm:customDate') : t('targetDateHeader')
          }
          slotProps={{
            textField: {
              id: 'targetDate',
              helperText:
                t(
                  formErrors.find((error) => error.path[0] === 'targetDate')
                    ?.message
                ) || 'DD.MM.YYYY',
              fullWidth: true,
              error: formErrors.some((error) => error.path[0] === 'targetDate'),
            },
          }}
          name="targetDate"
          value={targetDate ? dayjs(targetDate) : null}
          format="DD.MM.YYYY"
          minDate={startDate ? dayjs(startDate) : undefined}
          onChange={(date) => {
            onChange(date ? date.format('YYYY-MM-DD') : '')
            onClearError()
          }}
        />
      )}
    </>
  )
}

export default TargetDateSelect
