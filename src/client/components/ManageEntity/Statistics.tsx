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

  const theme = useTheme()

  if (thesisStatisticsLoading || !thesisStatistics) return null

  const statusCounts = thesisStatistics.totals.statusCounts
  const completedTotal = statusCounts['COMPLETED'] || 0
  const totalTheses = Object.values(statusCounts).reduce(
    (a: any, b: any) => a + b,
    0
  )

  const PIPELINE_STAGES = [
    { key: 'DRAFT', trans: 'draft', color: theme.palette.grey[400] },
    { key: 'SUGGESTED', trans: 'suggested', color: theme.palette.grey[500] },
    { key: 'PLANNING', trans: 'planned', color: theme.palette.grey[600] },
    { key: 'IN_PROGRESS', trans: 'inProgress', color: theme.palette.info.main },
    {
      key: 'ETHESIS_SENT',
      trans: 'ethesisSent',
      color: theme.palette.success.light,
    },
    { key: 'ETHESIS', trans: 'ethesis', color: theme.palette.success.main },
  ] as const

  const activeTotal = PIPELINE_STAGES.reduce(
    (sum, stage) => sum + (statusCounts[stage.key] || 0),
    0
  )

  const lateActive = thesisStatistics.totals.lateActiveSupervisionsCount || 0
  const onTimeActive = Math.max(
    0,
    (statusCounts['IN_PROGRESS'] || 0) - lateActive
  )

  const transparentSpacer = {
    itemStyle: { color: 'transparent' },
    label: { show: false },
    labelLine: { show: false },
    tooltip: { show: false },
  }

  // 1. Active Pipeline (Pie Chart)
  const pieInnerData = PIPELINE_STAGES.map((stage) => ({
    value: statusCounts[stage.key] || 0,
    name: t(`thesisStages:${stage.trans}`),
    itemStyle: { color: stage.color },
  })).filter((d) => d.value > 0)

  const pieOuterData: any[] = []
  PIPELINE_STAGES.forEach((stage) => {
    const value = statusCounts[stage.key] || 0
    if (value === 0) return

    if (stage.key === 'IN_PROGRESS') {
      if (onTimeActive > 0) {
        pieOuterData.push({
          value: onTimeActive,
          name: t('departmentStatisticsPage:onTime'),
          itemStyle: { color: theme.palette.info.light },
        })
      }
      if (lateActive > 0) {
        pieOuterData.push({
          value: lateActive,
          name: t('departmentStatisticsPage:late'),
          itemStyle: { color: theme.palette.error.light },
        })
      }
    } else {
      pieOuterData.push({ value, name: '', ...transparentSpacer })
    }
  })

  const milestoneCounts = thesisStatistics.totals.milestoneCounts || {}
  const hasMilestones = Object.keys(milestoneCounts).some(
    (m) => m !== '0' && milestoneCounts[m] > 0
  )

  const pieOuterOuterData: any[] = []
  PIPELINE_STAGES.forEach((stage) => {
    const value = statusCounts[stage.key] || 0
    if (value === 0) return

    if (stage.key === 'IN_PROGRESS') {
      Object.entries(milestoneCounts).forEach(([milestone, count]) => {
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
    } else {
      pieOuterOuterData.push({ value, name: '', ...transparentSpacer })
    }
  })

  const formatOuterLayerLabel = (params: any) => {
    if (params.name === '') return ''
    const inProgressTotal = statusCounts['IN_PROGRESS'] || 0
    const percent =
      inProgressTotal > 0
        ? ((params.value / inProgressTotal) * 100).toFixed(2)
        : '0.00'
    return `${params.name}\n${params.value} (${percent}%)`
  }

  const formatOuterLayerTooltip = (params: any) => {
    if (params.name === '') return ''
    const inProgressTotal = statusCounts['IN_PROGRESS'] || 0
    const percent =
      inProgressTotal > 0
        ? ((params.value / inProgressTotal) * 100).toFixed(2)
        : '0.00'
    return `${params.seriesName} <br/>${params.marker || ''} ${params.name}: ${params.value} (${percent}%)`
  }

  const pieOption = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
    series: [
      {
        name: t('departmentStatisticsPage:status'),
        type: 'pie',
        radius: [0, '35%'],
        minShowLabelAngle: 360 / pieInnerData.length - 1,
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
  if (
    thesisStatistics.totals.completedThesesTimes &&
    thesisStatistics.totals.completedThesesTimes.length > 0
  ) {
    thesisStatistics.totals.completedThesesTimes.forEach((days: number) => {
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
            {totalTheses}
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
            {completedTotal}
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
