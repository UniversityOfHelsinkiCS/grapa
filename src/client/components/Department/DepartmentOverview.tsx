import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CircularProgress,
  Box,
  Tab,
  Tabs,
  Typography,
  Stack,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { TranslationLanguage } from '@backend/types'
import useDepartments from '../../hooks/useDepartments'
import DepartmentTheses from './DepartmentTheses'
import DepartmentAdmin from './DepartmentAdmin'
import DepartmentStatistics from './DepartmentStatistics'

type DepartmentTab = 'theses' | 'rights' | 'statistics'

const parseDepartmentTab = (tab: string | null): DepartmentTab => {
  if (tab === 'rights' || tab === 'statistics') {
    return tab
  }

  return 'theses'
}

const DepartmentOverview = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const navigate = useNavigate()
  const { departmentId } = useParams()

  const { departments, isLoading: departmentsAreLoading } = useDepartments({
    includeNotManaged: false,
  })
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<
    string | null
  >(departmentId ?? null)
  const [tab, setTab] = useState<DepartmentTab>(
    parseDepartmentTab(searchParams.get('tab'))
  )

  useEffect(() => {
    if (!departments?.length) {
      return
    }

    const matchingDepartment = departments.find(
      (department) => department.id === departmentId
    )

    if (matchingDepartment) {
      setSelectedDepartmentId(matchingDepartment.id)
      return
    }

    setSelectedDepartmentId(departments[0].id)
    navigate(
      {
        pathname: `/departments/${departments[0].id}`,
        search: searchParams.toString() ? `?${searchParams.toString()}` : '',
      },
      { replace: true }
    )
  }, [departmentId, departments, navigate, searchParams])

  useEffect(() => {
    setTab(parseDepartmentTab(searchParams.get('tab')))
  }, [searchParams])

  const selectedDepartment = departments?.find(
    (department) => department.id === selectedDepartmentId
  )

  if (departmentsAreLoading || !departments?.length) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '1rem', py: '2rem', width: '100%' }}>
      {Boolean(selectedDepartment) && (
        <Stack sx={{ px: '1rem', py: '2rem' }} spacing={3}>
          <Typography component="h1" variant="h4">
            {selectedDepartment.name[language]}
          </Typography>

          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tab}
              onChange={(_, nextTab: DepartmentTab) => {
                const nextSearchParams = new URLSearchParams(searchParams)
                nextSearchParams.set('tab', nextTab)
                setSearchParams(nextSearchParams)
              }}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
            >
              <Tab
                label={t('departmentOverviewPage:supervisionStatisticsTab')}
                value="statistics"
              />
              <Tab
                label={t('departmentOverviewPage:supervisionsTab')}
                value="theses"
              />
              <Tab
                label={t('departmentOverviewPage:departmentAdminsTab')}
                value="rights"
              />
            </Tabs>
          </Box>

          {tab === 'theses' && (
            <Box>
              <DepartmentTheses
                filteringDepartmentId={selectedDepartmentId}
                noOwnThesesSwitch
                noAddThesisButton
                showExportOptions
                pageSize={100}
              />
            </Box>
          )}

          {tab === 'rights' && (
            <Box>
              <DepartmentAdmin
                filteringDepartmentId={selectedDepartment.id}
                hideTitle
              />
            </Box>
          )}

          {tab === 'statistics' && (
            <Box>
              <DepartmentStatistics
                filteringDepartmentId={selectedDepartment.id}
                hideTitle
              />
            </Box>
          )}
        </Stack>
      )}
    </Box>
  )
}

export default DepartmentOverview
