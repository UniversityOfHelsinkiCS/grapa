import {
  EventLogEntry,
  GradersChangedEvent,
  StatusChangedEvent,
  SupervisionsChangedEvent,
  ThesisCreatedEvent,
} from '@backend/types'
import { Collapse, Divider, Paper, Stack, Typography } from '@mui/material'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import BeforeDiffAfter from '../BeforeDiffAfter/BeforeDiffAfter'

const EventDate = ({ date }: { date: string }) => (
  <p>{new Date(date).toLocaleString('fi')}</p>
)

interface LogEntryProps {
  title: string
  date: string
  doneByString: string
  children?: React.ReactNode
}
const LogEntry = ({ title, date, doneByString, children }: LogEntryProps) => {
  return (
    <Stack
      spacing={1}
      sx={{
        borderStyle: 'none',
      }}
      component="fieldset"
    >
      <h3>{title}</h3>
      <EventDate date={date} />
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
      date={entry.createdAt}
      doneByString={`${t('eventLog:createdBy')} ${entry.user.email}`}
    />
  )
}

const SupervisionsChangedEntry = (entry: SupervisionsChangedEvent) => {
  const { t } = useTranslation()

  return (
    <LogEntry
      title={t('eventLog:supervisorsUpdated')}
      date={entry.createdAt}
      doneByString={`${t('eventLog:changedBy')} ${entry.user.email}`}
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
      date={entry.createdAt}
      doneByString={`${t('eventLog:changedBy')} ${entry.user.email}`}
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
      date={entry.createdAt}
      doneByString={`${t('eventLog:changedBy')} ${entry.user.email}`}
    >
      <BeforeDiffAfter beforeText={entry.data.from} afterText={entry.data.to} />
    </LogEntry>
  )
}

const EventsView: React.FC<{ events: EventLogEntry[] }> = ({ events }) => {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()

  return (
    <Paper
      elevation={1}
      sx={{ p: 2, mb: 2, border: '1px solid', borderColor: 'divider' }}
    >
      <Typography
        component="legend"
        sx={{
          cursor: 'pointer',
          color: 'text.primary',
          display: 'flex',
          alignItems: 'flex-start',
        }}
        onClick={() => setOpen(!open)}
      >
        <span style={{ marginRight: '0.5rem' }}>{open ? '▲' : '▼'}</span>
        {t('eventLog:title')}
      </Typography>
      <Collapse in={open}>
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
      </Collapse>
    </Paper>
  )
}

export default EventsView
