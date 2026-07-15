import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip, Typography } from '@mui/material'
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'

import {
  ThesisStatistics,
  ThesisStatus,
  TranslationLanguage,
} from '@backend/types'

import PrethesisTable from '../Common/PrethesisTable'

interface Props {
  statistics: ThesisStatistics[]
  isLoading?: boolean
}

const columnHelper = createColumnHelper<ThesisStatistics>()

const StatisticsTable = ({ statistics, isLoading }: Props) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const totalThesisCounts = useMemo(() => {
    return statistics.reduce(
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
  }, [statistics])

  const columns = useMemo(
    () => [
      columnHelper.accessor('supervisor', {
        id: 'supervisor',
        header: t('departmentStatisticsPage:supervisorHeader'),
        cell: (info) => {
          const { firstName, lastName, email } = info.getValue()
          return `${lastName} ${firstName} ${email ? ` (${email})` : ''}`
        },
        sortingFn: (rowA, rowB) => {
          const a = `${rowA.original.supervisor.lastName} ${rowA.original.supervisor.firstName}`
          const b = `${rowB.original.supervisor.lastName} ${rowB.original.supervisor.firstName}`
          return a.localeCompare(b)
        },
      }),
      columnHelper.accessor('department', {
        id: 'department',
        header: t('departmentStatisticsPage:departmentHeader'),
        cell: (info) => info.getValue()?.name?.[language] || '-',
      }),
      columnHelper.group({
        header: t('departmentStatisticsPage:thesisCountHeader'),
        id: 'thesisCount',
        columns: [
          columnHelper.accessor('statusCounts.DRAFT', {
            id: 'DRAFT',
            header: () => (
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {t('thesisStages:draft') + ` (${totalThesisCounts.DRAFT})`}
              </Typography>
            ),
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('statusCounts.SUGGESTED', {
            id: 'SUGGESTED',
            header: () => (
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {t('thesisStages:suggested') +
                  ` (${totalThesisCounts.SUGGESTED})`}
              </Typography>
            ),
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('statusCounts.PLANNING', {
            id: 'PLANNING',
            header: () => (
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {t('thesisStages:planned') + ` (${totalThesisCounts.PLANNING})`}
              </Typography>
            ),
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('statusCounts.IN_PROGRESS', {
            id: 'IN_PROGRESS',
            header: () => (
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {t('thesisStages:inProgress') +
                  ` (${totalThesisCounts.IN_PROGRESS})`}
              </Typography>
            ),
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('statusCounts.COMPLETED', {
            id: 'COMPLETED',
            header: () => (
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {t('thesisStages:completed') +
                  ` (${totalThesisCounts.COMPLETED})`}
              </Typography>
            ),
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('statusCounts.CANCELLED', {
            id: 'CANCELLED',
            header: () => (
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
              >
                {t('thesisStages:cancelled') +
                  ` (${totalThesisCounts.CANCELLED})`}
              </Typography>
            ),
            cell: (info) => info.getValue(),
          }),
          columnHelper.accessor('startedWithinHalfYearCount', {
            id: 'STARTED_WITHIN_HALF_YEAR',
            header: () => (
              <Tooltip
                title={t(
                  'departmentStatisticsPage:startedWithinHalfYearTooltip'
                )}
              >
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
                >
                  {t('departmentStatisticsPage:startedWithinHalfYearCount') +
                    ` (${totalThesisCounts.startedWithinHalfYearCount})`}
                </Typography>
              </Tooltip>
            ),
            cell: (info) => info.getValue(),
          }),
        ],
      }),
      columnHelper.accessor('lateSupervisionsCount', {
        id: 'LATE_COUNT',
        header: () => (
          <Tooltip title={t('departmentStatisticsPage:lateTooltip')}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              {t('departmentStatisticsPage:late')}
            </Typography>
          </Tooltip>
        ),
        cell: (info) => (info.getValue() !== 0 ? info.getValue() : '-'),
      }),
      columnHelper.accessor('avgLateSupervision', {
        id: 'LATE_TIME',
        header: () => (
          <Tooltip title={t('departmentStatisticsPage:avgLateTooltip')}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              {t('departmentStatisticsPage:avgLate')}
            </Typography>
          </Tooltip>
        ),
        cell: (info) =>
          info.getValue() !== 0 ? Math.round(info.getValue()) : '-',
      }),
      columnHelper.accessor('avgCompletedSupervision', {
        id: 'COMPLETE_TIME',
        header: () => (
          <Tooltip title={t('departmentStatisticsPage:avgCompletionTooltip')}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              {t('departmentStatisticsPage:avgCompletion')}
            </Typography>
          </Tooltip>
        ),
        cell: (info) =>
          info.getValue() !== 0 ? Math.round(info.getValue()) : '-',
      }),
      columnHelper.accessor('primarySupervisionsCount', {
        id: 'PRIMARY_SUPERVISED',
        header: () => (
          <Tooltip
            title={t('departmentStatisticsPage:primarySupervisionsTooltip')}
          >
            <Typography
              variant="body2"
              sx={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              {t('departmentStatisticsPage:primarySupervisions')}
            </Typography>
          </Tooltip>
        ),
        cell: (info) => info.getValue(),
      }),
    ],
    [language, t, totalThesisCounts]
  )

  const table = useReactTable({
    data: statistics,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: (row) => row.supervisor.id,
  })

  return <PrethesisTable table={table} isLoading={isLoading} />
}

export default StatisticsTable
