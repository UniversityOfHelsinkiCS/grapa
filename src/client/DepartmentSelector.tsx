import { useTranslation } from 'react-i18next'
import React, { useState } from 'react'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from '@mui/material'
import { TranslationLanguage } from '@backend/types'
import useDepartments from './hooks/useDepartments'
// eslint-disable-next-line import/no-named-as-default
import useUserDepartmentMutation from './hooks/useUserDepartmentMutation'

const DepartmentSelector: React.FC = () => {
  const { i18n, t } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const { departments } = useDepartments()
  const { mutateAsync: saveDepartment } = useUserDepartmentMutation()

  const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
    setSelectedDepartment(event.target.value)
  }

  const handleSubmit = async () => {
    await saveDepartment({ departmentId: selectedDepartment })
  }

  if (!departments) return null

  return (
    <Stack spacing={3} sx={{ p: '1rem', width: '650px', maxWidth: '1920px' }}>
      <Typography variant="h6">
        {t('departmentSelectPage:pageTitle')}
      </Typography>
      <Typography>{t('departmentSelectPage:pageDescription')}</Typography>
      <FormControl fullWidth>
        <InputLabel id="department-select-label">
          {t('departmentSelectPage:departmentPlaceholder')}
        </InputLabel>
        <Select
          labelId="department-select-label"
          id="department-select"
          label={t('departmentSelectPage:departmentPlaceholder')}
          value={selectedDepartment}
          onChange={handleDepartmentChange}
        >
          {departments.map((department) => (
            <MenuItem key={department.id} value={department.id}>
              {department.name[language]}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Button variant="contained" color="primary" onClick={handleSubmit}>
        {t('submitButton')}
      </Button>
    </Stack>
  )
}

export default DepartmentSelector
