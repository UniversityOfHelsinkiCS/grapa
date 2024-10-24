import {
  EventLogEntry,
  GradersChangedEvent,
  StatusChangedEvent,
  SupervisionsChangedEvent,
  ThesisCreatedEvent,
  ThesisDeletedEvent,
} from '@backend/types'
import TextDiff from '../TextDiff/TextDiff'

const ThesisCreatedEntry = (entry: ThesisCreatedEvent) => {
  return (
    <div>
      <h1>Thesis Created</h1>
      <p>Thesis ID: {entry.thesisId}</p>
      <p>Created by: {entry.user.email}</p>
    </div>
  )
}

const ThesisDeletedEntry = (entry: ThesisDeletedEvent) => {
  return (
    <div>
      <h1>Thesis Deleted</h1>
      <p>Thesis ID: {entry.thesisId}</p>
      <p>Deleted by: {entry.user.email}</p>
      <p>Thesis data was: {JSON.stringify(entry.data)}</p>
    </div>
  )
}

const SupervisionsChangedEntry = (entry: SupervisionsChangedEvent) => {
  return (
    <div>
      <h1>Supervisions Changed</h1>
      <p>Thesis ID: {entry.thesisId}</p>
      <p>Changed by: {entry.user.email}</p>
      <p>Supervisors change:</p>
      <TextDiff
        leftText={JSON.stringify(entry.data.originalSupervisions)}
        rightText={JSON.stringify(entry.data.updatedSupervisions)}
      />
    </div>
  )
}

const GradersChangedEntry = (entry: GradersChangedEvent) => {
  return (
    <div>
      <h1>Graders Changed</h1>
      <p>Thesis ID: {entry.thesisId}</p>
      <p>Changed by: {entry.user.email}</p>
      <p>Graders change:</p>
      <TextDiff
        leftText={JSON.stringify(entry.data.originalGraders)}
        rightText={JSON.stringify(entry.data.updatedGraders)}
      />
    </div>
  )
}

const StatusChangedEntry = (entry: StatusChangedEvent) => {
  return (
    <div>
      <h1>Status Changed</h1>
      <p>Thesis ID: {entry.thesisId}</p>
      <p>Changed by: {entry.user.email}</p>
      <p>Status change:</p>
      <TextDiff
        leftText={JSON.stringify(entry.data.from)}
        rightText={JSON.stringify(entry.data.to)}
      />
    </div>
  )
}

const EventsView: React.FC<{ events: EventLogEntry[] }> = ({ events }) => {
  return (
    <div>
      {events.map((event, index) => {
        switch (event.type) {
          case 'THESIS_CREATED':
            return (
              <ThesisCreatedEntry
                key={index}
                {...(event as ThesisCreatedEvent)}
              />
            )
          case 'THESIS_DELETED':
            return (
              <ThesisDeletedEntry
                key={index}
                {...(event as ThesisDeletedEvent)}
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
            return <div key={index}>Unknown event type: {event.type}</div>
        }
      })}
    </div>
  )
}

export default EventsView
