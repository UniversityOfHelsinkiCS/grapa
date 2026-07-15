import { useTranslation } from 'react-i18next'
import { Box, Tooltip, Typography } from '@mui/material'
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid'

import { fiFI, enUS } from '@mui/x-data-grid/locales'

import {
  ThesisStatistics,
  ThesisStatus,
  TranslationLanguage,
} from '@backend/types'

import { useThesisStatistics } from '../../hooks/useTheses'

interface Props {
  filteringDepartmentId?: string
  programId?: string
  studyTrackId?: string
  hideTitle?: boolean
}

const Statistics = ({
  filteringDepartmentId,
  programId,
  studyTrackId,
  hideTitle,
}: Props) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const { thesisStatistics, isLoading: thesisStatisticsLoading } =
    useThesisStatistics({
      departmentId: filteringDepartmentId,
      programId,
      studyTrackId,
    })

  if (thesisStatisticsLoading || !thesisStatistics) return null

  const filteredDepartmentStatistics = thesisStatistics.filter(
    ({ department }) => Boolean(department?.id)
  )

  const totalThesisCounts = filteredDepartmentStatistics.reduce(
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
      DRAFT: 0,
      SUGGESTED: 0,
      PLANNING: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    } as { startedWithinHalfYearCount: number } & Record<ThesisStatus, number>
  )

  const dataGridLocale = language === 'fi' ? fiFI : enUS

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
      field: 'thesisCount.DRAFT',
      headerName: t('thesisStages:draft'),
      renderHeader: () => (
        <Typography variant="body2">
          {t('thesisStages:draft') + ` (${totalThesisCounts.DRAFT})`}
        </Typography>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.DRAFT,
    },
    {
      field: 'thesisCount.SUGGESTED',
      headerName: t('thesisStages:suggested'),
      renderHeader: () => (
        <Typography variant="body2">
          {t('thesisStages:suggested') + ` (${totalThesisCounts.SUGGESTED})`}
        </Typography>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { statusCounts }) => statusCounts.SUGGESTED,
    },
    {
      field: 'thesisCount.PLANNING',
      headerName: t('thesisStages:planned'),
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
      headerName: t('thesisStages:inProgress'),
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
      headerName: t('thesisStages:completed'),
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
      headerName: t('thesisStages:cancelled'),
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
      headerName: t('departmentStatisticsPage:startedWithinHalfYearCount'),
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
    {
      field: 'thesisCount.LATE_COUNT',
      headerName: t('departmentStatisticsPage:late'),
      renderHeader: () => (
        <Tooltip title={t('departmentStatisticsPage:lateTooltip')}>
          <Typography variant="body2">
            {t('departmentStatisticsPage:late')}
          </Typography>
        </Tooltip>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { lateSupervisionsCount }) =>
        lateSupervisionsCount != 0 ? lateSupervisionsCount : null,
    },
    {
      field: 'thesisCount.LATE_TIME',
      headerName: t('departmentStatisticsPage:avgLate'),
      renderHeader: () => (
        <Tooltip title={t('departmentStatisticsPage:avgLateTooltip')}>
          <Typography variant="body2">
            {t('departmentStatisticsPage:avgLate')}
          </Typography>
        </Tooltip>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { avgLateSupervision }) =>
        avgLateSupervision != 0 ? `${Math.round(avgLateSupervision)}` : null,
    },
    {
      field: 'thesisCount.COMPLETE_TIME',
      headerName: t('departmentStatisticsPage:avgCompletion'),
      renderHeader: () => (
        <Tooltip title={t('departmentStatisticsPage:avgCompletionTooltip')}>
          <Typography variant="body2">
            {t('departmentStatisticsPage:avgCompletion')}
          </Typography>
        </Tooltip>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { avgCompletedSupervision }) =>
        avgCompletedSupervision != 0
          ? `${Math.round(avgCompletedSupervision)}`
          : null,
    },
    {
      field: 'thesisCount.PRIMARY_SUPERVISED',
      headerName: t('departmentStatisticsPage:primarySupervisions'),
      renderHeader: () => (
        <Tooltip
          title={t('departmentStatisticsPage:primarySupervisionsTooltip')}
        >
          <Typography variant="body2">
            {t('departmentStatisticsPage:primarySupervisions')}
          </Typography>
        </Tooltip>
      ),
      filterable: false,
      width: 150,
      type: 'number',
      valueGetter: (_, { primarySupervisionsCount }) =>
        primarySupervisionsCount,
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
      {!hideTitle && (
        <Typography
          data-testid="department-statistics-page-title"
          component="h1"
          variant="h4"
        >
          {t('departmentStatisticsPage:pageTitle')}
        </Typography>
      )}
      <DataGrid
        sx={{ mt: hideTitle ? 0 : '2rem' }}
        rows={filteredDepartmentStatistics}
        columns={columns}
        getRowId={(row) => row.supervisor.id}
        showToolbar={true}
        slots={{ toolbar: GridToolbar }}
        localeText={
          dataGridLocale.components.MuiDataGrid.defaultProps.localeText
        }
        columnGroupingModel={[
          {
            groupId: t('departmentStatisticsPage:thesisCountHeader'),
            headerAlign: 'center',
            children: [
              { field: 'thesisCount.DRAFT' },
              { field: 'thesisCount.SUGGESTED' },
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

export default Statistics
