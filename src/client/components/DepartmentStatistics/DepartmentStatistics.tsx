import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'

import {
  ThesisStatistics,
  ThesisStatus,
  TranslationLanguage,
} from '@backend/types'

import useLoggedInUser from '../../hooks/useLoggedInUser'
import useDepartments from '../../hooks/useDepartments'
import { useDepartmentStatistics } from '../../hooks/useDepartmentAdmins'

const DepartmentStatistics = () => {
  const { user, isLoading: userLoading } = useLoggedInUser()
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const { departments } = useDepartments({ includeNotManaged: false })
  const { departmentStatistics, isLoading: departmentStatisticsLoading } =
    useDepartmentStatistics()

  if (
    userLoading ||
    !departments?.length ||
    departmentStatisticsLoading ||
    !departmentStatistics
  )
    return null
  if (!user.isAdmin && !user.managedDepartmentIds?.length)
    return <Navigate to="/" />

  const totalThesisCounts = departmentStatistics.reduce(
    (acc, { statusCounts, startedWithinHalfYearCount }) => {
      ;(Object.entries(statusCounts) as [ThesisStatus, number][]).forEach(
        ([status, count]) => {
          acc[status] = (acc[status] || 0) + count
        }
      )
      acc.startedWithinHalfYearCount =
        (acc.startedWithinHalfYearCount || 0) + startedWithinHalfYearCount
      return acc
    },
    {
      startedWithinHalfYearCount: 0,
      PLANNING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    } as { startedWithinHalfYearCount: number } & Record<ThesisStatus, number>
  )

  const columns: GridColDef<ThesisStatistics>[] = [
    {
      field: 'supervisor',
      headerName: t('departmentStatisticsPage:supervisorHeader'),
      headerAlign: 'left',
      flex: 1,
      valueGetter: ({ firstName, lastName, email }) =>
        `${lastName} ${firstName} ${email ? ` (${email})` : ''}`,
    },
    {
      field: 'department',
      headerName: t('departmentStatisticsPage:departmentHeader'),
      headerAlign: 'left',
      flex: 1,
      valueGetter: ({ name }) => name[language],
    },
    {
      field: 'thesisCount.PLANNING',
      renderHeader: () => (
        <Typography variant="body2">
          {t('thesisStages:planned') + ` (${totalThesisCounts.PLANNING})`}
        </Typography>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.PLANNING,
    },
    {
      field: 'thesisCount.IN_PROGRESS',
      renderHeader: () => (
        <Typography variant="body2">
          {t('thesisStages:inProgress') + ` (${totalThesisCounts.IN_PROGRESS})`}
        </Typography>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.IN_PROGRESS,
    },
    {
      field: 'thesisCount.COMPLETED',
      renderHeader: () => (
        <Typography variant="body2">
          {t('thesisStages:completed') + ` (${totalThesisCounts.COMPLETED})`}
        </Typography>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.COMPLETED,
    },
    {
      field: 'thesisCount.CANCELLED',
      renderHeader: () => (
        <Typography variant="body2">
          {t('thesisStages:cancelled') + ` (${totalThesisCounts.CANCELLED})`}
        </Typography>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.CANCELLED,
    },
    {
      field: 'thesisCount.STARTED_WITHIN_HALF_YEAR',
      renderHeader: () => (
        <Tooltip
          title={t('departmentStatisticsPage:startedWithinHalfYearTooltip')}
        >
          <Typography variant="body2">
            {t('departmentStatisticsPage:startedWithinHalfYearCount') +
              ` (${totalThesisCounts.startedWithinHalfYearCount})`}
          </Typography>
        </Tooltip>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { startedWithinHalfYearCount }) =>
        startedWithinHalfYearCount,
    },
  ]

  return (
    <Box
      component="section"
      sx={{
        px: '3rem',
        py: '2rem',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        data-testid="department-statistics-page-title"
        component="h1"
        variant="h4"
      >
        {t('departmentStatisticsPage:pageTitle')}
      </Typography>
      <DataGrid
        sx={{ mt: '2rem' }}
        rows={departmentStatistics}
        columns={columns}
        getRowId={(row) => row.supervisor.id}
        slots={{ toolbar: GridToolbar }}
        columnGroupingModel={[
          {
            groupId: t('departmentStatisticsPage:thesisCountHeader'),
            headerAlign: 'center',
            children: [
              { field: 'thesisCount.PLANNING' },
              { field: 'thesisCount.IN_PROGRESS' },
              { field: 'thesisCount.COMPLETED' },
              { field: 'thesisCount.CANCELLED' },
              { field: 'thesisCount.STARTED_WITHIN_HALF_YEAR' },
            ],
          },
        ]}
        // we cannot disable pagination in the community version
        // so we set the page size to a high number
        pageSizeOptions={[2000]}
      />
    </Box>
  )
}

export default DepartmentStatistics
