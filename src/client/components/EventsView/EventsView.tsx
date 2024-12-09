import {
  EventLogEntry,
  EventLogEntryThesis,
  GradersChangedEvent,
  StatusChangedEvent,
  SupervisionsChangedEvent,
  ThesisCreatedEvent,
} from '@backend/types'
import { Divider, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'
import BeforeDiffAfter from '../BeforeDiffAfter/BeforeDiffAfter'

const EventDate = ({ date }: { date: string }) => (
  <p>{new Date(date).toLocaleString('fi')}</p>
)

interface LogEntryProps {
  title: string
  entry: EventLogEntry
  doneByString: string
  thesis?: EventLogEntryThesis
  children?: React.ReactNode
}
const LogEntry = ({ title, entry, doneByString, children }: LogEntryProps) => {
  const { t } = useTranslation()
  return (
    <Stack
      spacing={1}
      sx={{
        borderStyle: 'none',
      }}
      component="fieldset"
    >
      <h3>{title}</h3>
      {entry.thesis && (
        <p>{`${t('eventLog:thesis')}: ${entry.thesis.topic}`}</p>
      )}
      <EventDate date={entry.createdAt} />
      <p>{doneByString}</p>
      {children}
    </Stack>
  )
}

const ThesisCreatedEntry = (entry: ThesisCreatedEvent) => {
  const { t } = useTranslation()

  return (
    <LogEntry
      title={t('eventLog:thesisCreated')}
      entry={entry}
      doneByString={`${t('eventLog:createdBy')} ${entry?.user?.email ?? 'SYSTEM'}`}
    />
  )
}

const SupervisionsChangedEntry = (entry: SupervisionsChangedEvent) => {
  const { t } = useTranslation()

  return (
    <LogEntry
      title={t('eventLog:supervisorsUpdated')}
      entry={entry}
      doneByString={`${t('eventLog:changedBy')} ${entry?.user?.email ?? 'SYSTEM'}`}
    >
      <BeforeDiffAfter
        beforeText={JSON.stringify(entry.data.originalSupervisions, null, 2)}
        afterText={JSON.stringify(entry.data.updatedSupervisions, null, 2)}
      />
    </LogEntry>
  )
}

const GradersChangedEntry = (entry: GradersChangedEvent) => {
  const { t } = useTranslation()

  return (
    <LogEntry
      title={t('eventLog:gradersUpdated')}
      entry={entry}
      doneByString={`${t('eventLog:changedBy')} ${entry?.user?.email ?? 'SYSTEM'}`}
    >
      <BeforeDiffAfter
        beforeText={JSON.stringify(entry.data.originalGraders, null, 2)}
        afterText={JSON.stringify(entry.data.updatedGraders, null, 2)}
      />
    </LogEntry>
  )
}

const StatusChangedEntry = (entry: StatusChangedEvent) => {
  const { t } = useTranslation()

  return (
    <LogEntry
      title={t('eventLog:thesisStatusUpdated')}
      entry={entry}
      doneByString={`${t('eventLog:changedBy')} ${entry?.user?.email ?? 'SYSTEM'}`}
    >
      <BeforeDiffAfter beforeText={entry.data.from} afterText={entry.data.to} />
    </LogEntry>
  )
}

interface EventsViewProps {
  events: EventLogEntry[]
}
const EventsView: React.FC<EventsViewProps> = ({ events }) => {
  return (
    <Stack
      spacing={3}
      sx={{ mt: 2 }}
      divider={<Divider orientation="horizontal" flexItem />}
    >
      {events.map((event, index) => {
        switch (event.type) {
          case 'THESIS_CREATED':
            return (
              <ThesisCreatedEntry
                key={index}
                {...(event as ThesisCreatedEvent)}
              />
            )
          case 'THESIS_SUPERVISIONS_CHANGED':
            return (
              <SupervisionsChangedEntry
                key={index}
                {...(event as SupervisionsChangedEvent)}
              />
            )
          case 'THESIS_GRADERS_CHANGED':
            return (
              <GradersChangedEntry
                key={index}
                {...(event as GradersChangedEvent)}
              />
            )
          case 'THESIS_STATUS_CHANGED':
            return (
              <StatusChangedEntry
                key={index}
                {...(event as StatusChangedEvent)}
              />
            )
          default:
            return (
              <Typography key={index} color="error">
                Unknown event type: {event.type}
              </Typography>
            )
        }
      })}
    </Stack>
  )
}

export default EventsView
