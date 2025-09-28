import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Chip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
} from '@mui/material'
import { useState } from 'react'
import { usePaginatedTheses } from '../../hooks/useTheses'
import ThesisModal from './Modal'

const formatDate = (dateString: string | undefined) => {
  if (!dateString) return 'N/A'

  const date = new Date(dateString)
  if (isNaN(date.getTime())) return 'Invalid Date'

  return date.toISOString().split('T')[0] // Returns YYYY-MM-DD format
}

const Ethesis = () => {
  const [statusFilter, setStatusFilter] = useState<'NEW' | 'ALL'>('NEW')
  const [selectedThesis, setSelectedThesis] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  // Determine which statuses to include based on the filter
  const status =
    statusFilter === 'NEW' ? ['ETHESIS_SENT'] : ['ETHESIS', 'ETHESIS_SENT']

  const order = {
    sortBy: 'ethesisDate',
    orderBy: 'asc',
  }

  const paginationModel = {
    page: 0,
    pageSize: 20,
  }

  const {
    theses,
    totalCount,
    isLoading: isThesesLoading,
  } = usePaginatedTheses({
    order,
    status,
    offset: paginationModel.page * paginationModel.pageSize,
    limit: paginationModel.pageSize,
    onlySupervised: false,
  })

  const handleRowClick = (thesis: any) => {
    setSelectedThesis(thesis)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedThesis(null)
  }

  if (isThesesLoading) {
    return null
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        Ethesis ({totalCount} total, showing {theses.length})
      </Typography>

      <Box
        sx={{
          margin: 2,
          marginBottom: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography variant="body1">Show:</Typography>
        <RadioGroup
          row
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'NEW' | 'ALL')}
        >
          <FormControlLabel value="NEW" control={<Radio />} label="new" />
          <FormControlLabel value="ALL" control={<Radio />} label="all" />
        </RadioGroup>
      </Box>

      <TableContainer component={Paper} sx={{ margin: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Topic
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Author
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Graders
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Status
              </TableCell>
              <TableCell
                sx={{ fontWeight: 'bold', backgroundColor: 'grey.100' }}
              >
                Date
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {theses.map((thesis) => (
              <TableRow
                key={thesis.id}
                onClick={() => handleRowClick(thesis)}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'grey.50' },
                }}
              >
                <TableCell>{thesis.topic}</TableCell>
                <TableCell>
                  {thesis.authors
                    .map((author) => `${author.firstName} ${author.lastName}`)
                    .join(', ')}
                </TableCell>
                <TableCell>
                  {thesis.graders
                    .map(
                      (grader) =>
                        `${grader.user.firstName} ${grader.user.lastName}`
                    )
                    .join(', ')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={thesis.status}
                    color={thesis.status === 'ETHESIS' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(thesis.ethesisDate)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ThesisModal
        open={modalOpen}
        onClose={handleCloseModal}
        thesis={selectedThesis}
      />
    </div>
  )
}

export default Ethesis
