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
} from '@mui/material'
import { usePaginatedTheses } from '../../hooks/useTheses'

const Ethesis = () => {
  const order = {
    sortBy: 'date',
    orderBy: 'asc',
  }

  const paginationModel = {
    page: 0,
    pageSize: 20,
  }

  const status = ['ETHESIS', 'ETHESIS_SENT']

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

  if (isThesesLoading) {
    return null
  }

  return (
    <div>
      <Typography variant="h5" gutterBottom>
        E-thesis ({totalCount} total, showing {theses.length})
      </Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Topic</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Authors</TableCell>
              <TableCell>Graders</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {theses.map((thesis) => (
              <TableRow key={thesis.id}>
                <TableCell>{thesis.topic}</TableCell>
                <TableCell>
                  <Chip
                    label={thesis.status}
                    color={thesis.status === 'ETHESIS' ? 'success' : 'warning'}
                    size="small"
                  />
                </TableCell>
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  )
}

export default Ethesis
