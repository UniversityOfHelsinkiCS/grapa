import { useEffect, useState } from 'react'
import {
  CircularProgress,
  Box,
  Typography,
  Select,
  MenuItem,
  ListItemText,
  Stack,
  InputLabel,
  FormControl,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { TranslationLanguage } from '@backend/types'
import ThesesPage from '../ThesisPage/ThesesPage'
import useDepartments from '../../hooks/useDepartments'

const DepartmentOverview = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const { departments, isLoading: departmentsAreLoading } = useDepartments({
    includeNotManaged: false,
  })
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(null)

  const handleChange = (targetDepartmentId: string) =>
    setSelectedDepartmentId(targetDepartmentId)

  useEffect(() => {
    if (departments?.length > 0) {
      setSelectedDepartmentId(departments[0].id)
    }
  }, [departments, setSelectedDepartmentId])

  const selectedDepartment = departments?.find(
    (department) => department.id === selectedDepartmentId
  )

  if (departmentsAreLoading || !departments?.length) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '1rem', py: '2rem', width: '100%' }}>
      {selectedDepartment && departments?.length && (
        <>
          <FormControl sx={{ width: 500 }}>
            <InputLabel id="department-select-label">
              {t('departmentHeader')}
            </InputLabel>
            <Select
              data-testid="department-select-input"
              required
              value={selectedDepartment.id}
              id="DepartmentId"
              labelId="department-select-label"
              label={t('departmentHeader')}
              name="DepartmentId"
              onChange={(event) => {
                handleChange(event.target.value)
              }}
              renderValue={(value) =>
                departments.find((program) => program.id === value)?.name[
                  language
                ]
              }
            >
              {departments.map((program) => (
                <MenuItem
                  data-testid={`department-select-item-${program.id}`}
                  key={program.id}
                  value={program.id}
                >
                  <ListItemText inset primary={program.name[language]} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}
      {Boolean(selectedDepartment) && (
        <>
          <Stack sx={{ px: '1rem', py: '2rem' }}>
            <Typography component="h1" variant="h4">
              {t('theses')}
            </Typography>
            <ThesesPage
              filteringDepartmentId={selectedDepartmentId}
              noOwnThesesSwitch
              noAddThesisButton
              showExportOptions
            />
          </Stack>
        </>
      )}
    </Box>
  )
}

export default DepartmentOverview
