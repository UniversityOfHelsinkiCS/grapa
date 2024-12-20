import { useEffect, useState } from 'react'
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  Box,
  Typography,
  Select,
  MenuItem,
  ListItemText,
  Stack,
  InputLabel,
  FormControl,
} from '@mui/material'
import Divider from '@mui/material/Divider'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import usePrograms from '../../hooks/usePrograms'
import { useTranslation } from 'react-i18next'
import EventsView from '../EventsView/EventsView'
import { useProgramEvents } from '../../hooks/useEvents'
import { ProgramData, TranslationLanguage } from '@backend/types'
import ThesesPage from '../ThesisPage/ThesesPage'

interface SingleProgramLogsProps {
  program: ProgramData
}
const SingleProgramLogs = ({ program }: SingleProgramLogsProps) => {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  const { events, isLoading: eventsAreLoading } = useProgramEvents({
    enabled: Boolean(expanded),
    programId: program.id,
    showNonAdminOnly: false,
  })
  return (
    <Accordion
      key={program.id}
      expanded={expanded}
      onChange={() => setExpanded((prev) => !prev)}
      TransitionProps={{ timeout: 0 }}
    >
      <AccordionSummary
        sx={{ flexDirection: 'row-reverse' }}
        expandIcon={<ExpandMoreIcon />}
      >
        <Typography>{t('eventLog:title')}</Typography>
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

const ProgramOverview = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const { programs: programsUserManages, isLoading: programsAreLoading } =
    usePrograms({
      includeNotManaged: false,
    })
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    null
  )

  const handleChange = (targetProgramId: string) =>
    setSelectedProgramId(targetProgramId)

  useEffect(() => {
    if (programsUserManages?.length > 0) {
      setSelectedProgramId(programsUserManages[0].id)
    }
  }, [programsUserManages, setSelectedProgramId])

  const selectedProgram = programsUserManages?.find(
    (program) => program.id === selectedProgramId
  )

  if (programsAreLoading || !selectedProgram) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '1rem', py: '2rem', width: '100%' }}>
      {selectedProgram && programsUserManages?.length > 0 && (
        <>
          <FormControl sx={{ width: 500 }}>
            <InputLabel id="program-select-label">
              {t('programHeader')}
            </InputLabel>
            <Select
              data-testid="program-select-input"
              required
              value={selectedProgram.id}
              id="programId"
              labelId="department-select-label"
              label={t('programHeader')}
              name="programId"
              onChange={(event) => {
                handleChange(event.target.value)
              }}
              renderValue={(value) =>
                programsUserManages.find((program) => program.id === value)
                  ?.name[language]
              }
            >
              {programsUserManages.map((program) => (
                <MenuItem
                  data-testid={`program-select-item-${program.id}`}
                  key={program.id}
                  value={program.id}
                >
                  <ListItemText inset primary={program.name[language]} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}
      {Boolean(selectedProgram) && (
        <>
          <Stack
            sx={{ px: '1rem', py: '2rem' }}
            useFlexGap
            spacing={{ xs: 1, sm: 2 }}
          >
            <Typography component="h1" variant="h4">
              {t('programLogsPage:pageTitle')}
            </Typography>
            <SingleProgramLogs program={selectedProgram} />
          </Stack>

          <Divider sx={{ mt: 2, mb: 2, borderWidth: 'medium' }} />

          <Stack sx={{ px: '1rem', py: '2rem' }}>
            <Typography component="h1" variant="h4">
              {t('theses')}
            </Typography>
            <ThesesPage
              filteringProgramId={selectedProgram.id}
              noOwnThesesSwitch
              noAddThesisButton
            />
          </Stack>
        </>
      )}
    </Box>
  )
}

export default ProgramOverview
