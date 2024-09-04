import React from 'react'
import { Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'
import { DataGrid, GridColDef } from '@mui/x-data-grid'

import { ThesisStatistics } from '@backend/types'

import useLoggedInUser from '../../hooks/useLoggedInUser'
import useDepartments from '../../hooks/useDepartments'
import { useDepartmentStatistics } from '../../hooks/useDepartmentAdmins'

const DepartmentStatistics = () => {
  const { user, isLoading: userLoading } = useLoggedInUser()
  const { t } = useTranslation()

  const { departments } = useDepartments({ includeNotManaged: false })
  const { departmentStatistics, isLoading: departmentStatisticsLoading } =
    useDepartmentStatistics()

  if (
    userLoading ||
    departments.length === 0 ||
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
      flex: 1,
      valueGetter: ({ firstName, lastName, email }) =>
        `${firstName} ${lastName}${email ? ` (${email})` : ''}`,
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
      <Typography component="h1" variant="h4">
        {t('departmentStatisticsPage:pageTitle')}
      </Typography>
      <DataGrid
        sx={{ mt: '2rem' }}
        rows={departmentStatistics}
        columns={columns}
        pageSizeOptions={[100]}
        autoHeight
        getRowId={(row) => row.supervisor.id}
      />
    </Box>
  )
}

export default DepartmentStatistics
