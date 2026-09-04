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

import { ThesisFormErrors } from './thesisFormErrors'

interface TargetDateSelectProps {
  targetDates: { value: string }[]
  targetDate?: string
  startDate?: string
  errors: ThesisFormErrors
  onChange: (date: string) => void
}

const TargetDateSelect = ({
  targetDates,
  targetDate,
  startDate,
  errors,
  onChange,
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
                errors.clear('targetDate')
              }
            }}
            error={
              errors.has('targetDate') && targetDateDropdownValue !== 'custom'
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
            <FormHelperText error={errors.has('targetDate')}>
              {errors.message('targetDate') ?? 'DD.MM.YYYY'}
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
              helperText: errors.message('targetDate') ?? 'DD.MM.YYYY',
              fullWidth: true,
              error: errors.has('targetDate'),
            },
          }}
          name="targetDate"
          value={targetDate ? dayjs(targetDate) : null}
          format="DD.MM.YYYY"
          minDate={startDate ? dayjs(startDate) : undefined}
          onChange={(date) => {
            onChange(date ? date.format('YYYY-MM-DD') : '')
            errors.clear('targetDate')
          }}
        />
      )}
    </>
  )
}

export default TargetDateSelect
