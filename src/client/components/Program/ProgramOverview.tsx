import { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Button,
  CircularProgress,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Tab,
  Tabs,
  Typography,
  Stack,
  Switch,
  Tooltip,
} from '@mui/material'
import usePrograms, {
  useUpdateProgramOptionsMutation,
} from '../../hooks/usePrograms'
import { useTranslation } from 'react-i18next'
import EventsView from '../EventsView/EventsView'
import { useProgramEvents } from '../../hooks/useEvents'
import { ProgramData, TranslationLanguage } from '@backend/types'
import ThesesPage from '../ThesisPage/ThesesPage'
import ProgramManagement from './ProgramManagement'
import useLoggedInUser from '../../hooks/useLoggedInUser'

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

interface ProgramConfigurationsProps {
  program: ProgramData
}

const ProgramConfigurations = ({ program }: ProgramConfigurationsProps) => {
  const { t } = useTranslation()
  const updateProgramOptionsMutation = useUpdateProgramOptionsMutation()
  const seminarEnabled = Boolean(program.options?.seminar)
  const allowMultipleSeminarResponsibles = Boolean(
    program.options?.allowMultipleSeminarResponsibles
  )
  const [pendingSeminarValue, setPendingSeminarValue] = useState<
    boolean | null
  >(null)
  const [
    pendingAllowMultipleSeminarResponsiblesValue,
    setPendingAllowMultipleSeminarResponsiblesValue,
  ] = useState<boolean | null>(null)

  const handleSeminarToggle = async (event: ChangeEvent<HTMLInputElement>) => {
    setPendingSeminarValue(event.target.checked)
  }

  const handleCancelSeminarToggle = () => {
    setPendingSeminarValue(null)
  }

  const handleConfirmSeminarToggle = async () => {
    if (pendingSeminarValue === null) {
      return
    }

    await updateProgramOptionsMutation.mutateAsync({
      programId: program.id,
      options: {
        ...program.options,
        seminar: pendingSeminarValue,
      },
    })

    setPendingSeminarValue(null)
  }

  const handleAllowMultipleSeminarResponsiblesToggle = async (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    setPendingAllowMultipleSeminarResponsiblesValue(event.target.checked)
  }

  const handleCancelAllowMultipleSeminarResponsiblesToggle = () => {
    setPendingAllowMultipleSeminarResponsiblesValue(null)
  }

  const handleConfirmAllowMultipleSeminarResponsiblesToggle = async () => {
    if (pendingAllowMultipleSeminarResponsiblesValue === null) {
      return
    }

    await updateProgramOptionsMutation.mutateAsync({
      programId: program.id,
      options: {
        ...program.options,
        allowMultipleSeminarResponsibles:
          pendingAllowMultipleSeminarResponsiblesValue,
      },
    })

    setPendingAllowMultipleSeminarResponsiblesValue(null)
  }

  return (
    <>
      <Stack spacing={2}>
        <FormControlLabel
          control={
            <Switch
              checked={seminarEnabled}
              onChange={handleSeminarToggle}
              disabled={updateProgramOptionsMutation.isPending}
            />
          }
          label={
            <Tooltip title={t('programOverviewPage:seminarTooltip')}>
              <span>{t('programOverviewPage:seminarToggle')}</span>
            </Tooltip>
          }
        />
        {seminarEnabled && (
          <FormControlLabel
            control={
              <Switch
                checked={allowMultipleSeminarResponsibles}
                onChange={handleAllowMultipleSeminarResponsiblesToggle}
                disabled={updateProgramOptionsMutation.isPending}
              />
            }
            label={
              <Tooltip
                title={t(
                  'programOverviewPage:allowMultipleSeminarResponsiblesTooltip'
                )}
              >
                <span>
                  {t(
                    'programOverviewPage:allowMultipleSeminarResponsiblesToggle'
                  )}
                </span>
              </Tooltip>
            }
          />
        )}
      </Stack>

      <Dialog
        open={pendingSeminarValue !== null}
        onClose={handleCancelSeminarToggle}
      >
        <DialogTitle>
          {t('programOverviewPage:seminarConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t(
              pendingSeminarValue
                ? 'programOverviewPage:seminarEnableConfirmContent'
                : 'programOverviewPage:seminarDisableConfirmContent'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={handleCancelSeminarToggle}>
            {t('cancelButton')}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleConfirmSeminarToggle}
            disabled={updateProgramOptionsMutation.isPending}
          >
            {t('submitButton')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={pendingAllowMultipleSeminarResponsiblesValue !== null}
        onClose={handleCancelAllowMultipleSeminarResponsiblesToggle}
      >
        <DialogTitle>
          {t(
            'programOverviewPage:allowMultipleSeminarResponsiblesConfirmTitle'
          )}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t(
              pendingAllowMultipleSeminarResponsiblesValue
                ? 'programOverviewPage:allowMultipleSeminarResponsiblesEnableConfirmContent'
                : 'programOverviewPage:allowMultipleSeminarResponsiblesDisableConfirmContent'
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            type="button"
            onClick={handleCancelAllowMultipleSeminarResponsiblesToggle}
          >
            {t('cancelButton')}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleConfirmAllowMultipleSeminarResponsiblesToggle}
            disabled={updateProgramOptionsMutation.isPending}
          >
            {t('submitButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const ProgramOverview = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const navigate = useNavigate()
  const { programId } = useParams()
  const { user } = useLoggedInUser()
  const { programs: programsUserManages, isLoading: programsAreLoading } =
    usePrograms({
      includeNotManaged: false,
    })
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(
    programId ?? null
  )
  const [tab, setTab] = useState<
    'theses' | 'rights' | 'configurations' | 'logs'
  >('theses')

  useEffect(() => {
    if (!programsUserManages?.length) {
      return
    }

    const matchingProgram = programsUserManages.find(
      (program) => program.id === programId
    )

    if (matchingProgram) {
      setSelectedProgramId(matchingProgram.id)
      return
    }

    setSelectedProgramId(programsUserManages[0].id)
    navigate(`/programs/${programsUserManages[0].id}`, { replace: true })
  }, [navigate, programId, programsUserManages])

  useEffect(() => {
    setTab('theses')
  }, [selectedProgramId])

  const selectedProgram = programsUserManages?.find(
    (program) => program.id === selectedProgramId
  )

  if (programsAreLoading || !selectedProgram) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '1rem', py: '2rem', width: '100%' }}>
      {Boolean(selectedProgram) && (
        <>
          <Stack sx={{ px: '1rem', py: '2rem' }} spacing={3}>
            <Typography component="h1" variant="h4">
              {selectedProgram.name[language]}
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs
                value={tab}
                onChange={(
                  _,
                  nextTab: 'theses' | 'rights' | 'configurations' | 'logs'
                ) => setTab(nextTab)}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
              >
                <Tab label={t('theses')} value="theses" />
                <Tab label={t('navbar:programManager')} value="rights" />
                <Tab label={t('eventLog:title')} value="logs" />
                {user?.isAdmin && (
                  <Tab
                    label={t('programOverviewPage:configurationsTab')}
                    value="configurations"
                  />
                )}
              </Tabs>
            </Box>

            {tab === 'theses' && (
              <Box>
                <ThesesPage
                  filteringProgramId={selectedProgram.id}
                  noOwnThesesSwitch
                  noAddThesisButton
                />
              </Box>
            )}

            {tab === 'rights' && (
              <Box>
                <ProgramManagement
                  filteringProgramId={selectedProgram.id}
                  hideTitle
                />
              </Box>
            )}

            {user?.isAdmin && tab === 'configurations' && (
              <Box>
                <ProgramConfigurations program={selectedProgram} />
              </Box>
            )}

            {tab === 'logs' && (
              <Box>
                <SingleProgramLogs program={selectedProgram} />
              </Box>
            )}
          </Stack>
        </>
      )}
    </Box>
  )
}

export default ProgramOverview
