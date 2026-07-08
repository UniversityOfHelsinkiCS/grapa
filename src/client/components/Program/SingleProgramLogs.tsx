import { Box, CircularProgress } from '@mui/material'
import { ProgramData } from '@backend/types'
import { useProgramEvents } from '../../hooks/useEvents'
import EventsView from '../EventsView/EventsView'

interface SingleProgramLogsProps {
  program: ProgramData
}

const SingleProgramLogs = ({ program }: SingleProgramLogsProps) => {
  const { events, isLoading: eventsAreLoading } = useProgramEvents({
    enabled: true,
    programId: program.id,
    showNonAdminOnly: false,
  })

  return (
    <Box>
      {eventsAreLoading ? (
        <CircularProgress />
      ) : (
        <EventsView events={events ?? []} />
      )}
    </Box>
  )
}

export default SingleProgramLogs
