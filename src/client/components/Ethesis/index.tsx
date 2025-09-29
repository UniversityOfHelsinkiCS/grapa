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
  Container,
} from '@mui/material'
import { useState } from 'react'
import { usePaginatedTheses } from '../../hooks/useTheses'
import ThesisModal from './Modal'
import { StatusLocale } from '../../types'
import { t } from 'i18next'

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
    sortOrder: 'desc' as const,
  }

  const paginationModel = {
    page: 0,
    pageSize: 20,
  }

  const { theses: unsortedTheses, isLoading: isThesesLoading } =
    usePaginatedTheses({
      order,
      status,
      offset: paginationModel.page * paginationModel.pageSize,
      limit: paginationModel.pageSize,
      onlySupervised: false,
    })

  const theses = unsortedTheses
    ? [...unsortedTheses].sort((a, b) => {
        if (a.status !== b.status) {
          if (a.status === 'ETHESIS_SENT' && b.status === 'ETHESIS') return -1
          if (a.status === 'ETHESIS' && b.status === 'ETHESIS_SENT') return 1
        }

        const dateA = a.ethesisDate ? new Date(a.ethesisDate).getTime() : 0
        const dateB = b.ethesisDate ? new Date(b.ethesisDate).getTime() : 0
        return dateB - dateA
      })
    : []

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
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h5" gutterBottom>
        {status.length === 1 ? 'New ' : 'All '} theses submitted to Etheses
      </Typography>

      <Box
        sx={{
          mb: 3,
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

      <TableContainer component={Paper}>
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
                    label={t(StatusLocale[thesis.status])}
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
    </Container>
  )
}

export default Ethesis
