import { Box } from '@mui/material'
import { useThesisStatistics } from '../../hooks/useTheses'
import SupervisionsTable from './SupervisionsTable'

interface Props {
  filteringDepartmentId?: string
  programId?: string
  studyTrackId?: string
}

const Supervisions = ({
  filteringDepartmentId,
  programId,
  studyTrackId,
}: Props) => {
  const { thesisStatistics, isLoading: thesisStatisticsLoading } =
    useThesisStatistics({
      departmentId: filteringDepartmentId,
      programId,
      studyTrackId,
    })

  return (
    <Box
      sx={{
        mt: '2rem',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
      }}
    >
      <SupervisionsTable
        statistics={thesisStatistics?.supervisors || []}
        isLoading={thesisStatisticsLoading}
      />
    </Box>
  )
}

export default Supervisions
