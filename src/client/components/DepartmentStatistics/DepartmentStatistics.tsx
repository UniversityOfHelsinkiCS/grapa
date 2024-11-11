import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

import { ThesisStatistics, TranslationLanguage } from '@backend/types'

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
      headerName: t('thesisStages:planned'),
      width: 100,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.PLANNING,
    },
    {
      field: 'thesisCount.IN_PROGRESS',
      headerName: t('thesisStages:inProgress'),
      width: 100,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.IN_PROGRESS,
    },
    {
      field: 'thesisCount.COMPLETED',
      headerName: t('thesisStages:completed'),
      width: 100,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.COMPLETED,
    },
    {
      field: 'thesisCount.CANCELLED',
      headerName: t('thesisStages:cancelled'),
      width: 100,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.CANCELLED,
    },
  ]

  return (
    <Box component="section" sx={{ px: '3rem', py: '2rem', width: '100%' }}>
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
        pageSizeOptions={[100]}
        autoHeight
        getRowId={(row) => row.supervisor.id}
        columnGroupingModel={[
          {
            groupId: t('departmentStatisticsPage:thesisCountHeader'),
            headerAlign: 'center',
            children: [
              { field: 'thesisCount.PLANNING' },
              { field: 'thesisCount.IN_PROGRESS' },
              { field: 'thesisCount.COMPLETED' },
              { field: 'thesisCount.CANCELLED' },
            ],
          },
        ]}
      />
    </Box>
  )
}

export default DepartmentStatistics
