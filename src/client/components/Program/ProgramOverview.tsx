import { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import 'dayjs/locale/fi'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers'
import {
  Button,
  CircularProgress,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Typography,
  Stack,
  Switch,
  Tooltip,
  TextField,
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

interface FeatureFlagControlProps {
  isDateInput?: boolean
  program: ProgramData
  updateMutation: any
  feature: string
  translation: any
  versioned?: boolean
}

const FeatureFlagControl = ({
  program,
  updateMutation,
  feature,
  translation,
}: FeatureFlagControlProps) => {
  const featureStatus = Boolean(
    program.options ? program.options[feature] == true : false
  )

  const [pendingValue, setPendingValue] = useState<boolean | null>(null)

  const handleToggle = async (event: ChangeEvent<HTMLInputElement>) => {
    setPendingValue(event.target.checked)
  }

  const handleCancelToggle = () => {
    setPendingValue(null)
  }

  const handleConfirmToggle = async () => {
    if (pendingValue === null) {
      return
    }

    const options = program.options
    options[feature] = pendingValue

    await updateMutation.mutateAsync({
      programId: program.id,
      options: options,
    })

    setPendingValue(null)
  }

  return (
    <>
      <FormControlLabel
        control={
          <Switch
            checked={featureStatus}
            onChange={handleToggle}
            disabled={updateMutation.isPending}
          />
        }
        label={
          <Tooltip
            title={translation(`programOverviewPage:${feature}:tooltip`)}
          >
            <span>{translation(`programOverviewPage:${feature}:toggle`)}</span>
          </Tooltip>
        }
      />

      <Dialog open={pendingValue !== null} onClose={handleCancelToggle}>
        <DialogTitle>
          {translation(`programOverviewPage:${feature}:confirmTitle`)}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {translation(
              pendingValue
                ? `programOverviewPage:${feature}:enableConfirm`
                : `programOverviewPage:${feature}:disableConfirm`
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={handleCancelToggle}>
            {translation('cancelButton')}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleConfirmToggle}
            disabled={updateMutation.isPending}
          >
            {translation('submitButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const ListInput = ({
  isDateInput = false,
  program,
  updateMutation,
  feature,
  translation,
  versioned,
}: FeatureFlagControlProps) => {
  const [listValues, setListValues] = useState(
    program.options && program.options[feature]
      ? versioned
        ? program.options[feature].versions
          ? program.options[feature].versions.at(-1)
          : []
        : program.options[feature]
      : []
  )

  const [pendingValue, setPendingValue] = useState<any | null>(null)

  const handleSave = async () => {
    const validValues = isDateInput
      ? listValues.filter((v: any) => dayjs(v.value).isValid())
      : listValues

    if (isDateInput && validValues.length !== listValues.length) {
      setListValues(validValues)
    }
    setPendingValue(validValues)
  }

  const handleCancelToggle = () => {
    setPendingValue(null)
  }

  const handleConfirmToggle = async () => {
    if (pendingValue === null) {
      return
    }

    const options = program.options
    if (versioned && !options[feature]) options[feature] = { versions: [] }
    if (versioned && !options[feature].versions) options[feature].versions = []
    if (versioned) options[feature].versions.push(pendingValue)
    else options[feature] = pendingValue

    await updateMutation.mutateAsync({
      programId: program.id,
      options: options,
    })

    setPendingValue(null)
  }

  return (
    <>
      <Stack
        sx={{
          gap: '1rem',
          width: '40rem',
        }}
      >
        <Typography variant="h5">
          {translation(`programOverviewPage:${feature}:title`)}
        </Typography>
        {listValues.map((value, index) => {
          return (
            <Stack
              direction="row"
              sx={{
                gap: '1rem',
              }}
              key={index}
            >
              {isDateInput ? (
                <DatePicker
                  label={`${index + 1}. ${translation(`programOverviewPage:${feature}:fieldTitle`)}`}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                    },
                  }}
                  value={value.value ? dayjs(value.value) : null}
                  format="DD.MM.YYYY"
                  onChange={(date) => {
                    setListValues(
                      listValues.map((v, i) => {
                        return i == index
                          ? { value: date ? date.format('YYYY-MM-DD') : '' }
                          : v
                      })
                    )
                  }}
                  sx={{
                    width: '100%',
                  }}
                />
              ) : (
                <TextField
                  variant="outlined"
                  label={`${index + 1}. ${translation(`programOverviewPage:${feature}:fieldTitle`)}`}
                  value={value.value}
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                    setListValues(
                      listValues.map((v, i) => {
                        return i == index ? { value: event.target.value } : v
                      })
                    )
                  }}
                  sx={{
                    width: '100%',
                  }}
                ></TextField>
              )}

              <Button
                variant="contained"
                color="error"
                onClick={() => {
                  setListValues(
                    listValues.filter((_v: any, i: any) => i != index)
                  )
                }}
              >
                Poista
              </Button>
            </Stack>
          )
        })}
        <Stack direction="row" sx={{ gap: '1rem' }}>
          <Button variant="contained" onClick={handleSave}>
            Tallenna
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              setListValues([
                ...listValues,
                {
                  value: '',
                },
              ])
            }}
          >
            Lisää kohde
          </Button>
        </Stack>
      </Stack>

      <Dialog open={pendingValue !== null} onClose={handleCancelToggle}>
        <DialogTitle>
          {translation(`programOverviewPage:${feature}:confirmTitle`)}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {translation(
              pendingValue
                ? `programOverviewPage:${feature}:enableConfirm`
                : `programOverviewPage:${feature}:disableConfirm`
            )}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={handleCancelToggle}>
            {translation('cancelButton')}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleConfirmToggle}
            disabled={updateMutation.isPending}
          >
            {translation('submitButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

const ProgramConfigurations = ({ program }: ProgramConfigurationsProps) => {
  const { t } = useTranslation()
  const updateProgramOptionsMutation = useUpdateProgramOptionsMutation()

  const options = {
    seminar: 'boolean',
    allowMultipleSeminarResponsibles: 'boolean',
    allowStudentStartedProcess: 'boolean',
    waysOfWorkingRequired: 'boolean',
    allowMultipleAuthors: 'boolean',
    hideSendToEthesis: 'boolean',
    useMilestones: 'boolean',
  }

  const featureFlagUI = Object.keys(options).map((feature) => {
    //@ts-expect-error hardcoded above
    if (options[feature] == 'boolean') {
      return (
        <FeatureFlagControl
          program={program}
          updateMutation={updateProgramOptionsMutation}
          feature={feature}
          translation={t}
          key={feature}
        ></FeatureFlagControl>
      )
    }
  })
  const defaultNumberOfGraders =
    (program.options?.numberOfGraders as number | undefined) ?? 2
  const [draftNumberOfGraders, setDraftNumberOfGraders] = useState<number>(
    defaultNumberOfGraders
  )
  const [confirmingNumberOfGraders, setConfirmingNumberOfGraders] =
    useState(false)

  const handleCancelNumberOfGradersChange = () => {
    setConfirmingNumberOfGraders(false)
    setDraftNumberOfGraders(defaultNumberOfGraders)
  }

  const handleConfirmNumberOfGradersChange = async () => {
    await updateProgramOptionsMutation.mutateAsync({
      programId: program.id,
      options: {
        ...program.options,
        numberOfGraders: draftNumberOfGraders,
      },
    })
    setConfirmingNumberOfGraders(false)
  }

  return (
    <>
      <Stack spacing={2}>
        <Typography variant="h5">
          {t(`programOverviewPage:features`)}
        </Typography>

        {featureFlagUI}
        {program.options?.useMilestones && (
          <ListInput
            feature="milestones"
            versioned={true}
            program={program}
            translation={t}
            updateMutation={updateProgramOptionsMutation}
          ></ListInput>
        )}

        <ListInput
          isDateInput={true}
          feature="targetDates"
          program={program}
          translation={t}
          updateMutation={updateProgramOptionsMutation}
        ></ListInput>

        <Typography variant="h5">{t(`programOverviewPage:other`)}</Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, pt: 1 }}>
          <Typography>
            {t('programOverviewPage:numberOfGradersLabel')}
          </Typography>
          <FormControl size="small">
            <Select
              id="number-of-graders-select"
              value={draftNumberOfGraders}
              onChange={(e) => setDraftNumberOfGraders(Number(e.target.value))}
            >
              <MenuItem value={2}>2</MenuItem>
              <MenuItem value={3}>3</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="contained"
            disabled={
              updateProgramOptionsMutation.isPending ||
              draftNumberOfGraders === defaultNumberOfGraders
            }
            onClick={() => setConfirmingNumberOfGraders(true)}
          >
            {t('submitButton')}
          </Button>
        </Box>
      </Stack>

      <Dialog
        open={confirmingNumberOfGraders}
        onClose={handleCancelNumberOfGradersChange}
      >
        <DialogTitle>
          {t('programOverviewPage:numberOfGradersConfirmTitle')}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {t('programOverviewPage:numberOfGradersConfirmContent', {
              count: draftNumberOfGraders,
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button type="button" onClick={handleCancelNumberOfGradersChange}>
            {t('cancelButton')}
          </Button>
          <Button
            type="button"
            variant="contained"
            onClick={handleConfirmNumberOfGradersChange}
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
