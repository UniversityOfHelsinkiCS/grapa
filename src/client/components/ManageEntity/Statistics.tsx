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

  const totals = {
    draft: thesisStatistics.totals.statusCounts['DRAFT'] || 0,
    suggested: thesisStatistics.totals.statusCounts['SUGGESTED'] || 0,
    planning: thesisStatistics.totals.statusCounts['PLANNING'] || 0,
    inProgress: thesisStatistics.totals.statusCounts['IN_PROGRESS'] || 0,
    ethesisSent: thesisStatistics.totals.statusCounts['ETHESIS_SENT'] || 0,
    ethesis: thesisStatistics.totals.statusCounts['ETHESIS'] || 0,
    completed: thesisStatistics.totals.statusCounts['COMPLETED'] || 0,
    late: thesisStatistics.totals.lateSupervisionsCount || 0,
    lateActive: thesisStatistics.totals.lateActiveSupervisionsCount || 0,
    total: Object.values(thesisStatistics.totals.statusCounts).reduce(
      (a: any, b: any) => a + b,
      0
    ),
    milestoneCounts: thesisStatistics.totals.milestoneCounts || {},
    completedThesesTimes: thesisStatistics.totals.completedThesesTimes || [],
  }

  const activeTotal =
    totals.draft +
    totals.suggested +
    totals.planning +
    totals.inProgress +
    totals.ethesisSent +
    totals.ethesis

  const onTimeActive = Math.max(0, totals.inProgress - totals.lateActive)
  const lateActive = totals.lateActive

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
      value: totals.inProgress,
      name: t('thesisStages:inProgress'),
      itemStyle: { color: theme.palette.info.main },
    },
    {
      value: totals.ethesisSent,
      name: t('thesisStages:ethesisSent'),
      itemStyle: { color: theme.palette.success.light },
    },
    {
      value: totals.ethesis,
      name: t('thesisStages:ethesis'),
      itemStyle: { color: theme.palette.success.main },
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
  if (totals.inProgress > 0) {
    pieOuterData.push(
      {
        value: onTimeActive,
        name: t('departmentStatisticsPage:onTime'),
        itemStyle: { color: theme.palette.info.light },
      },
      {
        value: lateActive,
        name: t('departmentStatisticsPage:late'),
        itemStyle: { color: theme.palette.error.light },
      }
    )
  }
  if (totals.ethesisSent > 0)
    pieOuterData.push({
      value: totals.ethesisSent,
      name: '',
      ...transparentSpacer,
    })
  if (totals.ethesis > 0)
    pieOuterData.push({ value: totals.ethesis, name: '', ...transparentSpacer })

  const hasMilestones = Object.keys(totals.milestoneCounts).some(
    (m) => m !== '0' && totals.milestoneCounts[m] > 0
  )

  const pieOuterOuterData = []
  if (totals.draft > 0)
    pieOuterOuterData.push({
      value: totals.draft,
      name: '',
      ...transparentSpacer,
    })
  if (totals.suggested > 0)
    pieOuterOuterData.push({
      value: totals.suggested,
      name: '',
      ...transparentSpacer,
    })
  if (totals.planning > 0)
    pieOuterOuterData.push({
      value: totals.planning,
      name: '',
      ...transparentSpacer,
    })
  if (totals.inProgress > 0) {
    Object.entries(totals.milestoneCounts).forEach(([milestone, count]) => {
      if (count > 0) {
        const milestoneIndex = parseInt(milestone, 10)
        const milestoneLabel = Number.isNaN(milestoneIndex)
          ? t('departmentStatisticsPage:unknown')
          : milestoneIndex === 0
            ? t('progressView:noMilestone')
            : `${t('progressView:milestone')} ${milestoneIndex}`
        const milestoneColors = [
          theme.palette.primary.light,
          theme.palette.primary.main,
          theme.palette.primary.dark,
          theme.palette.secondary.light,
          theme.palette.secondary.main,
          theme.palette.secondary.dark,
        ]

        const color =
          Number.isNaN(milestoneIndex) || milestoneIndex === 0
            ? theme.palette.grey[300]
            : milestoneColors[(milestoneIndex - 1) % milestoneColors.length]

        pieOuterOuterData.push({
          value: count,
          name: milestoneLabel,
          itemStyle: { color },
        })
      }
    })
  }
  if (totals.ethesisSent > 0)
    pieOuterOuterData.push({
      value: totals.ethesisSent,
      name: '',
      ...transparentSpacer,
    })
  if (totals.ethesis > 0)
    pieOuterOuterData.push({
      value: totals.ethesis,
      name: '',
      ...transparentSpacer,
    })

  const formatOuterLayerLabel = (params: any) => {
    if (params.name === '') return ''
    const percent =
      totals.inProgress > 0
        ? ((params.value / totals.inProgress) * 100).toFixed(2)
        : '0.00'
    return `${params.name}\n${params.value} (${percent}%)`
  }

  const formatOuterLayerTooltip = (params: any) => {
    if (params.name === '') return ''
    const percent =
      totals.inProgress > 0
        ? ((params.value / totals.inProgress) * 100).toFixed(2)
        : '0.00'
    return `${params.seriesName} <br/>${params.marker || ''} ${params.name}: ${params.value} (${percent}%)`
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
        label: { formatter: formatOuterLayerLabel },
        labelLine: { length: 10, length2: 10 },
        tooltip: { formatter: formatOuterLayerTooltip },
        data: pieOuterData,
      },
      ...(hasMilestones
        ? [
            {
              name: t('progressView:milestone'),
              type: 'pie',
              radius: ['70%', '85%'],
              label: { formatter: formatOuterLayerLabel },
              labelLine: { length: 10, length2: 10 },
              tooltip: { formatter: formatOuterLayerTooltip },
              data: pieOuterOuterData,
            },
          ]
        : []),
    ],
  }

  // 2. Average Completion Time Distribution (Histogram)
  const bucketSize = 30
  const maxBucketLimit = 510
  const completionBuckets: Record<string, number> = {}

  completionBuckets[`< ${bucketSize}`] = 0
  for (let i = bucketSize; i < maxBucketLimit; i += bucketSize) {
    completionBuckets[`${i}-${i + bucketSize}`] = 0
  }
  completionBuckets[`> ${maxBucketLimit}`] = 0

  let hasCompletionData = false
  if (totals.completedThesesTimes && totals.completedThesesTimes.length > 0) {
    totals.completedThesesTimes.forEach((days: number) => {
      if (days > 0) {
        hasCompletionData = true
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
  }

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
      name: t('departmentStatisticsPage:students'),
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

      {/* Overview Numbers */}
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
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            flex: '1 1 200px',
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
          }}
        >
          <Typography variant="h6">
            {t('departmentStatisticsPage:total')}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {totals.total}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            flex: '1 1 200px',
            bgcolor: 'info.main',
            color: 'info.contrastText',
          }}
        >
          <Typography variant="h6">
            {t('departmentStatisticsPage:active')}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {activeTotal}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: 2,
            flex: '1 1 200px',
            bgcolor: 'success.main',
            color: 'success.contrastText',
          }}
        >
          <Typography variant="h6">
            {t('departmentStatisticsPage:completed')}
          </Typography>
          <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
            {totals.completed}
          </Typography>
        </Paper>
      </Box>

      {hasPipelineData && (
        <Box
          sx={{
            display: 'flex',
            gap: '2rem',
            mt: '2rem',
            justifyContent: 'center',
          }}
        >
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
              {t('departmentStatisticsPage:thesisPipeline')}
            </Typography>
            <ReactECharts
              option={pieOption}
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
          statistics={thesisStatistics.supervisors}
          isLoading={thesisStatisticsLoading}
        />
      </Box>
    </Box>
  )
}

export default Statistics
