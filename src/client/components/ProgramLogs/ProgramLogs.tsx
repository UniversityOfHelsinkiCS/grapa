import { useState } from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Box,
  Typography,
  FormControlLabel,
  Switch,
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
  showNonAdminOnly: boolean
  handleChange: (
    targetProgramId: string
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void
}
const SingleProgramLogs = ({
  program,
  expanded,
  showNonAdminOnly,
  handleChange,
}: SingleProgramLogsProps) => {
  const { i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const { events, isLoading: eventsAreLoading } = useProgramEvents({
    enabled: Boolean(expanded),
    programId: program.id,
    showNonAdminOnly,
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
  const [showNonAdminOnly, setShowNonAdminOnly] = useState(true)

  const handleChange =
    (targetProgramId: string) =>
    (_: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? targetProgramId : false)
    }

  if (programsAreLoading) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '3rem', py: '2rem', width: '100%' }}>
      <Typography component="h1" variant="h4" mb={3}>
        {t('programLogsPage:pageTitle')}
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: '1rem' }}>
        {
          <FormControlLabel
            control={
              <Switch
                checked={showNonAdminOnly}
                onChange={() => setShowNonAdminOnly((prev) => !prev)}
              />
            }
            label={t('programLogsPage:showNonAdminOnlySwitch')}
          />
        }
      </Box>
      {programs.map((program) => (
        <SingleProgramLogs
          key={program.id}
          program={program}
          showNonAdminOnly={showNonAdminOnly}
          expanded={expanded === program.id}
          handleChange={handleChange}
        />
      ))}
    </Box>
  )
}

export default ProgramLogs
