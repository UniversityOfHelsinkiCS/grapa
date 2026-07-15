import { useTranslation } from 'react-i18next'
import { Box, Typography } from '@mui/material'

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
      <Box
        sx={{
          mt: hideTitle ? 0 : '2rem',
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
