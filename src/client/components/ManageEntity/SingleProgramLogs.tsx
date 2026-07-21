import { useState } from 'react'
import {
  Box,
  CircularProgress,
  Stack,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ProgramData } from '@backend/validators/programResponse'
import { useProgramEvents } from '../../hooks/useEvents'
import EventsView from '../EventsView/EventsView'
import { useDebounce } from '../../hooks/useDebounce'

interface SingleProgramLogsProps {
  program: ProgramData
}

const SingleProgramLogs = ({ program }: SingleProgramLogsProps) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedSearchQuery = useDebounce(searchQuery, 400)

  const {
    events,
    totalCount,
    isLoading: eventsAreLoading,
  } = useProgramEvents({
    enabled: true,
    programId: program.id,
    showNonAdminOnly: false,
    limit: rowsPerPage,
    offset: page * rowsPerPage,
    search: debouncedSearchQuery.length > 0 ? debouncedSearchQuery : undefined,
  })

  const handleChangePage = (
    event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  return (
    <Box>
      <Stack
        direction="row"
        sx={{ justifyContent: 'flex-start', alignItems: 'center', mb: 2 }}
      >
        <TextField
          size="small"
          placeholder={t('thesesTableToolbar:search')}
          variant="outlined"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setPage(0)
          }}
        />
      </Stack>
      {eventsAreLoading ? (
        <CircularProgress />
      ) : (
        <>
          {events && events.length > 0 ? (
            <EventsView events={events} />
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">
                {t('eventLog:noLogs')}
              </Typography>
            </Box>
          )}
          <TablePagination
            component="div"
            count={totalCount ?? 0}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  )
}

export default SingleProgramLogs
