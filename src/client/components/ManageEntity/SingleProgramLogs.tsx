import { useState } from 'react'
import {
  Box,
  CircularProgress,
  TablePagination,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'
import { ProgramData } from '@backend/types'
import { useProgramEvents } from '../../hooks/useEvents'
import EventsView from '../EventsView/EventsView'

interface SingleProgramLogsProps {
  program: ProgramData
}

const SingleProgramLogs = ({ program }: SingleProgramLogsProps) => {
  const { t } = useTranslation()
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

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
