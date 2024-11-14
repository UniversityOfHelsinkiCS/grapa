import { useState } from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import usePrograms from '../../hooks/usePrograms'
import { useTranslation } from 'react-i18next'
import EventsView from '../EventsView/EventsView'
import { useProgramEvents } from '../../hooks/useEvents'
import { ProgramData, TranslationLanguage } from '@backend/types'

interface SingleProgramLogsProps {
  program: ProgramData
  expanded: boolean
  handleChange: (
    panel: string
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void
}
const SingleProgramLogs = ({
  program,
  expanded,
  handleChange,
}: SingleProgramLogsProps) => {
  const { i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const { events, isLoading: eventsAreLoading } = useProgramEvents({
    enabled: Boolean(expanded),
    programId: program.id,
  })
  return (
    <Accordion
      key={program.id}
      expanded={expanded}
      onChange={handleChange(program.id)}
    >
      <AccordionSummary
        sx={{ flexDirection: 'row-reverse' }}
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography>{program.name[language]}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {eventsAreLoading ? (
          <CircularProgress />
        ) : (
          <EventsView events={events ?? []} />
        )}
      </AccordionDetails>
    </Accordion>
  )
}

const ProgramLogs = () => {
  const { t } = useTranslation()
  const { programs, isLoading: programsAreLoading } = usePrograms({
    includeNotManaged: false,
  })
  const [expanded, setExpanded] = useState<string | false>(false)

  const handleChange =
    (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false)
    }

  if (programsAreLoading) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '3rem', py: '2rem', width: '100%' }}>
      <Typography component="h1" variant="h4" mb={3}>
        {t('programLogsPage:pageTitle')}
      </Typography>
      {programs.map((program) => (
        <SingleProgramLogs
          key={program.id}
          program={program}
          expanded={expanded === program.id}
          handleChange={handleChange}
        />
      ))}
    </Box>
  )
}

export default ProgramLogs
