import { useTranslation } from 'react-i18next'
import { Box, Typography, useTheme, Paper } from '@mui/material'
import ReactECharts from 'echarts-for-react'

import { useThesisStatistics } from '../../hooks/useTheses'
import StatisticsTable from './StatisticsTable'

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
  const { t } = useTranslation()

  const { thesisStatistics, isLoading: thesisStatisticsLoading } =
    useThesisStatistics({
      departmentId: filteringDepartmentId,
      programId,
      studyTrackId,
    })

  if (thesisStatisticsLoading || !thesisStatistics) return null

  const theme = useTheme()

  const totals = thesisStatistics.reduce(
    (acc, curr) => {
      acc.draft += curr.statusCounts['DRAFT'] || 0
      acc.suggested += curr.statusCounts['SUGGESTED'] || 0
      acc.planning += curr.statusCounts['PLANNING'] || 0
      acc.active += curr.statusCounts['IN_PROGRESS'] || 0
      acc.ethesis += curr.statusCounts['ETHESIS'] || 0
      acc.late += curr.lateSupervisionsCount || 0
      return acc
    },
    { draft: 0, suggested: 0, planning: 0, active: 0, ethesis: 0, late: 0 }
  )

  const onTimeActive = Math.max(0, totals.active - totals.late)

  // 1. Active Pipeline (Pie Chart)
  const pieInnerData = [
    {
      value: totals.draft,
      name: t('thesisStages:draft'),
      itemStyle: { color: theme.palette.grey[400] },
    },
    {
      value: totals.suggested,
      name: t('thesisStages:suggested'),
      itemStyle: { color: theme.palette.grey[500] },
    },
    {
      value: totals.planning,
      name: t('thesisStages:planned'),
      itemStyle: { color: theme.palette.grey[600] },
    },
    {
      value: totals.active,
      name: t('thesisStages:inProgress'),
      itemStyle: { color: theme.palette.info.main },
    },
  ].filter((d) => d.value > 0)

  const pieOuterData = []
  const transparentSpacer = {
    itemStyle: { color: 'transparent' },
    label: { show: false },
    labelLine: { show: false },
    tooltip: { show: false },
  }

  if (totals.draft > 0)
    pieOuterData.push({ value: totals.draft, name: '', ...transparentSpacer })
  if (totals.suggested > 0)
    pieOuterData.push({
      value: totals.suggested,
      name: '',
      ...transparentSpacer,
    })
  if (totals.planning > 0)
    pieOuterData.push({
      value: totals.planning,
      name: '',
      ...transparentSpacer,
    })
  if (totals.active > 0) {
    pieOuterData.push(
      {
        value: onTimeActive,
        name: t('departmentStatisticsPage:onTime'),
        itemStyle: { color: theme.palette.info.light },
      },
      {
        value: totals.late,
        name: t('departmentStatisticsPage:late'),
        itemStyle: { color: theme.palette.error.light },
      }
    )
  }

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    series: [
      {
        name: t('departmentStatisticsPage:status'),
        type: 'pie',
        selectedMode: 'single',
        radius: [0, '35%'],
        label: { position: 'inner', fontSize: 11, color: '#fff' },
        labelLine: { show: false },
        data: pieInnerData,
      },
      {
        name: t('departmentStatisticsPage:details'),
        type: 'pie',
        radius: ['45%', '60%'],
        label: { formatter: '{b}\n{c} ({d}%)' },
        labelLine: { length: 10, length2: 10 },
        data: pieOuterData,
      },
    ],
  }

  // 2. Average Completion Time Distribution (Histogram)
  const bucketSize = 90
  const maxBucketLimit = 540
  const completionBuckets: Record<string, number> = {}

  completionBuckets[`< ${bucketSize}`] = 0
  for (let i = bucketSize; i < maxBucketLimit; i += bucketSize) {
    completionBuckets[`${i}-${i + bucketSize}`] = 0
  }
  completionBuckets[`> ${maxBucketLimit}`] = 0

  let hasCompletionData = false
  thesisStatistics.forEach((stat) => {
    if (stat.avgCompletedSupervision > 0) {
      hasCompletionData = true
      const days = stat.avgCompletedSupervision
      if (days < bucketSize) {
        completionBuckets[`< ${bucketSize}`]++
      } else if (days >= maxBucketLimit) {
        completionBuckets[`> ${maxBucketLimit}`]++
      } else {
        const bucketStart = Math.floor(days / bucketSize) * bucketSize
        completionBuckets[`${bucketStart}-${bucketStart + bucketSize}`]++
      }
    }
  })

  const completionHistogramOption = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: Object.keys(completionBuckets),
      name: t('departmentStatisticsPage:days'),
      nameLocation: 'middle',
      nameGap: 40,
      axisLabel: { interval: 0, rotate: 30 },
    },
    yAxis: {
      type: 'value',
      name: t('departmentStatisticsPage:supervisors'),
      minInterval: 1,
    },
    series: [
      {
        data: Object.values(completionBuckets),
        type: 'bar',
        barCategoryGap: '2%',
        color: theme.palette.secondary.main,
      },
    ],
  }

  // 3. Department Health / On-Time Ratio (Gauge Chart)
  const onTimeRatio =
    totals.active > 0 ? Math.round((onTimeActive / totals.active) * 100) : 0
  const gaugeOption = {
    tooltip: { formatter: '{a} <br/>{b} : {c}%' },
    series: [
      {
        name: t('departmentStatisticsPage:onTimeRatio'),
        type: 'gauge',
        progress: {
          show: true,
          width: 18,
          itemStyle: { color: theme.palette.success.main },
        },
        axisLine: { lineStyle: { width: 10 } },
        axisTick: { show: false },
        splitLine: { length: 15, lineStyle: { width: 2, color: '#999' } },
        detail: { valueAnimation: true, formatter: '{value}%', fontSize: 30 },
        data: [
          { value: onTimeRatio, name: t('departmentStatisticsPage:onTime') },
        ],
      },
    ],
  }

  const hasPipelineData = pieInnerData.length > 0

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

      {hasPipelineData && (
        <Box
          sx={{
            display: 'flex',
            gap: '2rem',
            mt: '2rem',
            justifyContent: 'center',
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
              flex: '1 1 400px',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {t('departmentStatisticsPage:thesisPipeline')}
            </Typography>
            <ReactECharts
              option={pieOption}
              style={{ height: '350px', width: '100%' }}
            />
          </Paper>

          {hasCompletionData && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                borderRadius: 2,
                flex: '1 1 400px',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {t('departmentStatisticsPage:avgCompletionDist')}
              </Typography>
              <ReactECharts
                option={completionHistogramOption}
                style={{ height: '350px', width: '100%' }}
              />
            </Paper>
          )}

          <Paper
            variant="outlined"
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 2,
              flex: '1 1 400px',
            }}
          >
            <Typography variant="h6" gutterBottom>
              {t('departmentStatisticsPage:onTimeRatio')}
            </Typography>
            <ReactECharts
              option={gaugeOption}
              style={{ height: '350px', width: '100%' }}
            />
          </Paper>
        </Box>
      )}

      <Box
        sx={{
          mt: '2rem',
          border: 1,
          borderColor: 'divider',
          borderRadius: 1,
        }}
      >
        <StatisticsTable
          statistics={thesisStatistics}
          isLoading={thesisStatisticsLoading}
        />
      </Box>
    </Box>
  )
}

export default Statistics
