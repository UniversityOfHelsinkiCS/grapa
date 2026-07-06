import { ChangeEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import 'dayjs/locale/fi'
import dayjs from 'dayjs'
import { isEqual } from 'lodash-es'
import { DatePicker } from '@mui/x-date-pickers'
import {
  Button,
  CircularProgress,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Typography,
  Stack,
  Switch,
  Tooltip,
  TextField,
  Autocomplete,
  Alert,
  Chip,
  IconButton,
  Paper,
} from '@mui/material'
import Popup from '../Common/Popup'
import usePrograms, { useUpdateProgramMutation } from '../../hooks/usePrograms'
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import { useTranslation } from 'react-i18next'
import EventsView from '../EventsView/EventsView'
import { useProgramEvents } from '../../hooks/useEvents'
import {
  ProgramData,
  TranslationLanguage,
  StudyTrackData,
} from '@backend/types'
import ThesesPage from '../ThesisPage/ThesesPage'
import EntityManagement from './EntityManagement'
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
  isMultilingualInput?: boolean
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

  const handleToggle = (event: ChangeEvent<HTMLInputElement>) => {
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

      <Popup
        open={pendingValue !== null}
        onClose={handleCancelToggle}
        title={translation(`programOverviewPage:${feature}:confirmTitle`)}
        onSubmit={handleConfirmToggle}
        submitText={translation('submitButton')}
        submitDisabled={updateMutation.isPending}
        cancelText={translation('cancelButton')}
      >
        <Typography>
          {translation(
            pendingValue
              ? `programOverviewPage:${feature}:enableConfirm`
              : `programOverviewPage:${feature}:disableConfirm`
          )}
        </Typography>
      </Popup>
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
  isMultilingualInput = false,
}: FeatureFlagControlProps) => {
  const [listValues, setListValues] = useState(() => {
    let initial =
      program.options && program.options[feature]
        ? versioned
          ? program.options[feature].versions
            ? program.options[feature].versions.at(-1)
            : []
          : program.options[feature]
        : []

    if (isMultilingualInput) {
      initial = initial.map((item: any) => {
        const val = item.value
        if (typeof val === 'string') {
          return { value: { fi: val, sv: val, en: val } }
        }
        return item
      })
    }
    return initial
  })

  const [pendingValue, setPendingValue] = useState<any | null>(null)

  const handleSave = () => {
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

    if (versioned) {
      const currentVersions = options[feature]?.versions || []
      const lastVersion =
        currentVersions.length > 0 ? currentVersions.at(-1) : []
      if (isEqual(pendingValue, lastVersion)) {
        setPendingValue(null)
        return
      }
    }
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
        }}
      >
        <Typography variant="h5">
          {translation(`programOverviewPage:${feature}:title`)}
        </Typography>
        <Typography variant="body1">
          {translation(`programOverviewPage:${feature}:description`)}
        </Typography>
        {listValues.map((value, index) => {
          return (
            <Paper
              variant="outlined"
              sx={{
                width: '40rem',
                p: 1,
                borderRadius: '0.25rem',
              }}
            >
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
                ) : isMultilingualInput ? (
                  <Stack direction="column" sx={{ width: '100%', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {`${index + 1}. ${translation(`programOverviewPage:${feature}:fieldTitle`)}`}
                    </Typography>
                    {['fi', 'sv', 'en'].map((lang) => (
                      <TextField
                        key={lang}
                        size="small"
                        variant="outlined"
                        label={lang.toUpperCase()}
                        value={value.value?.[lang] || ''}
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          setListValues(
                            listValues.map((v: any, i: number) => {
                              if (i === index) {
                                return {
                                  ...v,
                                  value: {
                                    ...v.value,
                                    [lang]: event.target.value,
                                  },
                                }
                              }
                              return v
                            })
                          )
                        }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <TextField
                    variant="outlined"
                    label={`${index + 1}. ${translation(`programOverviewPage:${feature}:fieldTitle`)}`}
                    value={value.value}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setListValues(
                        listValues.map((v: any, i: number) => {
                          return i == index ? { value: event.target.value } : v
                        })
                      )
                    }}
                    sx={{
                      width: '100%',
                    }}
                  ></TextField>
                )}
                <Stack sx={{ justifyContent: 'center' }}>
                  <Tooltip title={translation('deleteButton', 'Poista')}>
                    <IconButton
                      arial-label={translation('deleteButton', 'Poista')}
                      onClick={() => {
                        setListValues(
                          listValues.filter((_v: any, i: any) => i != index)
                        )
                      }}
                      color="error"
                    >
                      <RemoveCircleOutlineOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </Stack>
            </Paper>
          )
        })}
        <Stack direction="row" sx={{ gap: '1rem' }}>
          <Button variant="contained" onClick={handleSave}>
            {translation('common:saveButton')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setListValues([
                ...listValues,
                isDateInput
                  ? { value: null }
                  : isMultilingualInput
                    ? { value: { fi: '', sv: '', en: '' } }
                    : { value: '' },
              ])
            }}
          >
            {translation('common:addItem')}
          </Button>
        </Stack>
      </Stack>

      <Popup
        open={pendingValue !== null}
        onClose={handleCancelToggle}
        title={translation(`programOverviewPage:${feature}:confirmTitle`)}
        onSubmit={handleConfirmToggle}
        submitText={translation('submitButton')}
        submitDisabled={updateMutation.isPending}
        cancelText={translation('cancelButton')}
      >
        <Typography>
          {translation(
            pendingValue
              ? `programOverviewPage:${feature}:enableConfirm`
              : `programOverviewPage:${feature}:disableConfirm`
          )}
        </Typography>
      </Popup>
    </>
  )
}

const CombinedStudyTracksInput = ({
  program,
  updateMutation,
  translation,
}: FeatureFlagControlProps) => {
  const { i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const initialData =
    (program.options?.combinedStudyTracks as Record<string, string>) || {}

  const [listValues, setListValues] = useState<
    { primary: string | null; secondaries: StudyTrackData[] }[]
  >(() => {
    const map = new Map<string, string[]>()
    Object.entries(initialData).forEach(([sec, prim]) => {
      if (!map.has(prim)) map.set(prim, [])
      map.get(prim)!.push(sec)
    })
    return Array.from(map.entries()).map(([primary, secondaries]) => ({
      primary,
      secondaries:
        program.allStudyTracks?.filter((t) => secondaries.includes(t.id)) || [],
    }))
  })

  const [pendingValue, setPendingValue] = useState<Record<
    string,
    string
  > | null>(null)

  const handleSave = () => {
    const validValues = listValues.filter(
      (v) => v.primary && v.secondaries.length > 0
    )
    const newCombined: Record<string, string> = {}
    validValues.forEach((v) => {
      if (v.primary) {
        v.secondaries.forEach((sec) => {
          newCombined[sec.id] = v.primary!
        })
      }
    })
    setPendingValue(newCombined)
  }

  const handleCancelToggle = () => {
    setPendingValue(null)
  }

  const handleConfirmToggle = async () => {
    if (pendingValue === null) {
      return
    }

    const options = program.options || {}
    options.combinedStudyTracks = pendingValue

    await updateMutation.mutateAsync({
      programId: program.id,
      options: options,
    })

    setPendingValue(null)
  }

  const availableStudyTracks = program.allStudyTracks || []

  const hiddenStudyTracks = new Set(
    listValues.flatMap((v) => v.secondaries.map((s) => s.id))
  )

  const visibleStudyTracks = availableStudyTracks.filter(
    (t) => !hiddenStudyTracks.has(t.id)
  )

  return (
    <>
      <Stack sx={{ gap: '1rem' }}>
        <Typography variant="h5">
          {translation(`programOverviewPage:combinedStudyTracks:title`)}
        </Typography>
        <Typography variant="body1">
          {translation(`programOverviewPage:combinedStudyTracks:description`)}
        </Typography>

        <Stack direction="column" sx={{ gap: '0.5rem', mt: 1, mb: 1 }}>
          <Typography variant="subtitle2">
            {translation(
              `programOverviewPage:combinedStudyTracks:previewTitle`
            )}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {visibleStudyTracks.map((track) => (
              <Chip key={track.id} label={track.name[language]} size="small" />
            ))}
          </Box>
        </Stack>
        {listValues.map((value, index) => {
          // A secondary study track cannot be selected if it's already used somewhere else
          // Or if it's the primary track
          const usedSecondaryIds = new Set(
            listValues.flatMap((v, i) =>
              i !== index ? v.secondaries.map((s) => s.id) : []
            )
          )
          const usedPrimaryIds = new Set(
            listValues.flatMap((v, i) =>
              i !== index && v.primary ? [v.primary] : []
            )
          )
          const allPrimaryIds = new Set(
            listValues.flatMap((v) => (v.primary ? [v.primary] : []))
          )
          const allSecondaryIds = new Set(
            listValues.flatMap((v) => v.secondaries.map((s) => s.id))
          )

          return (
            <Stack
              direction="column"
              sx={{
                gap: '1rem',
                p: 2,
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              key={index}
            >
              <FormControl fullWidth>
                <InputLabel>
                  {translation(
                    `programOverviewPage:combinedStudyTracks:primary`
                  )}
                </InputLabel>
                <Select
                  value={value.primary || ''}
                  label={translation(
                    `programOverviewPage:combinedStudyTracks:primary`
                  )}
                  onChange={(e) => {
                    const newValues = [...listValues]
                    newValues[index].primary = e.target.value as string
                    setListValues(newValues)
                  }}
                >
                  {availableStudyTracks.map((track) => (
                    <MenuItem
                      key={track.id}
                      value={track.id}
                      disabled={
                        usedPrimaryIds.has(track.id) ||
                        allSecondaryIds.has(track.id)
                      }
                    >
                      {track.name[language]}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                multiple
                options={availableStudyTracks.filter(
                  (t) => !allPrimaryIds.has(t.id) && !usedSecondaryIds.has(t.id)
                )}
                getOptionLabel={(option) => option.name[language]}
                value={value.secondaries}
                onChange={(_, newValue) => {
                  const newValues = [...listValues]
                  newValues[index].secondaries = newValue
                  setListValues(newValues)
                }}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label={translation(
                      `programOverviewPage:combinedStudyTracks:secondaries`
                    )}
                  />
                )}
              />

              <Button
                variant="outlined"
                color="error"
                onClick={() => {
                  setListValues(listValues.filter((_, i) => i !== index))
                }}
              >
                {translation('deleteButton', 'Poista')}
              </Button>
            </Stack>
          )
        })}

        <Stack direction="row" sx={{ gap: '1rem' }}>
          <Button variant="contained" onClick={handleSave}>
            {translation('common:submitButton')}
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setListValues([...listValues, { primary: null, secondaries: [] }])
            }}
          >
            {translation('common:addItem')}
          </Button>
        </Stack>
      </Stack>

      <Popup
        open={pendingValue !== null}
        onClose={handleCancelToggle}
        title={translation(
          `programOverviewPage:combinedStudyTracks:confirmTitle`
        )}
        onSubmit={handleConfirmToggle}
        submitText={translation('submitButton')}
        submitDisabled={updateMutation.isPending}
        cancelText={translation('cancelButton')}
      >
        <Typography>
          {translation(
            `programOverviewPage:combinedStudyTracks:confirmContent`
          )}
        </Typography>
      </Popup>
    </>
  )
}

const ProgramConfigurations = ({ program }: ProgramConfigurationsProps) => {
  const { t } = useTranslation()
  const updateProgramOptionsMutation = useUpdateProgramMutation()

  const options = {
    seminar: 'boolean',
    allowMultipleSeminarResponsibles: 'boolean',
    allowStudentStartedProcess: 'boolean',
    waysOfWorkingRequired: 'boolean',
    allowMultipleAuthors: 'boolean',
    hideSendToEthesis: 'boolean',
    useMilestones: 'boolean',
    disableStudyTracks: 'boolean',
    useIdleState: 'boolean',
    supervisorApproval: 'boolean',
    thesisProgramManagerNotRequired: 'boolean',
    isBachelorProgram: 'boolean',
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
        {program.options?.useMilestones && (
          <ListInput
            feature="milestones"
            isMultilingualInput
            program={program}
            updateMutation={updateProgramOptionsMutation}
            translation={t}
            versioned
          ></ListInput>
        )}

        <ListInput
          isDateInput={true}
          feature="targetDates"
          program={program}
          translation={t}
          updateMutation={updateProgramOptionsMutation}
        ></ListInput>

        {Boolean(program.studyTracks?.length) && (
          <CombinedStudyTracksInput
            feature="combinedStudyTracks"
            program={program}
            translation={t}
            updateMutation={updateProgramOptionsMutation}
          />
        )}

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
              {(program?.options?.isBachelorProgram ||
                draftNumberOfGraders === 1) && <MenuItem value={1}>1</MenuItem>}
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

        <Typography variant="h5">
          {t(`programOverviewPage:features`)}
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Box>{t('programOverviewPage:featureFlagWarning')}</Box>
        </Alert>

        {featureFlagUI}
      </Stack>

      <Popup
        open={confirmingNumberOfGraders}
        onClose={handleCancelNumberOfGradersChange}
        title={t('programOverviewPage:numberOfGradersConfirmTitle')}
        onSubmit={handleConfirmNumberOfGradersChange}
        submitText={t('submitButton')}
        submitDisabled={updateProgramOptionsMutation.isPending}
        cancelText={t('cancelButton')}
      >
        <Typography>
          {t('programOverviewPage:numberOfGradersConfirmContent', {
            count: draftNumberOfGraders,
          })}
        </Typography>
      </Popup>
    </>
  )
}

const EntityOverview = () => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const navigate = useNavigate()
  const { programId, studyTrackId } = useParams()

  const entityType = studyTrackId ? 'studyTrack' : 'program'

  const { user } = useLoggedInUser()
  const { programs: allPrograms, isLoading } = usePrograms({
    includeNotManaged: true,
  })

  const programsUserManages =
    allPrograms?.filter((p) => user?.isAdmin || p.isManaged) || []
  const studyTracksUserManages =
    allPrograms
      ?.flatMap((p) => p.studyTracks || [])
      .filter((st) => st && (user?.isAdmin || st.isManaged)) || []

  const entities =
    entityType === 'program' ? programsUserManages : studyTracksUserManages

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
    (entityType === 'program' ? programId : studyTrackId) ?? null
  )
  const [tab, setTab] = useState<
    'theses' | 'rights' | 'configurations' | 'logs'
  >('theses')
  const [configurationsAcknowledged, setConfigurationsAcknowledged] =
    useState(false)

  useEffect(() => {
    if (!entities?.length) {
      return
    }

    const currentId = entityType === 'program' ? programId : studyTrackId

    const matchingEntity = entities.find((entity) => entity.id === currentId)

    if (matchingEntity) {
      setSelectedEntityId(matchingEntity.id)
      return
    }

    setSelectedEntityId(entities[0].id)
    if (entityType === 'program') {
      void navigate(`/programs/${entities[0].id}`, { replace: true })
    } else {
      void navigate(`/study-tracks/${entities[0].id}`, { replace: true })
    }
  }, [navigate, programId, studyTrackId, entities, entityType])

  useEffect(() => {
    setTab('theses')
  }, [selectedEntityId])

  const selectedEntity = entities?.find(
    (entity) => entity.id === selectedEntityId
  )

  if (isLoading || !selectedEntity) {
    return <CircularProgress />
  }

  return (
    <Box component="section" sx={{ px: '1rem', py: '2rem', width: '100%' }}>
      {Boolean(selectedEntity) && (
        <>
          <Stack sx={{ px: '1rem', py: '2rem' }} spacing={3}>
            <Typography component="h1" variant="h4">
              {selectedEntity.name[language]}
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
                {entityType === 'program' && (
                  <Tab label={t('eventLog:title')} value="logs" />
                )}
                {entityType === 'program' && (
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
                  filteringProgramId={
                    entityType === 'program' ? selectedEntity.id : undefined
                  }
                  filteringStudyTrackId={
                    entityType === 'studyTrack' ? selectedEntity.id : undefined
                  }
                  noOwnThesesSwitch
                  noAddThesisButton
                />
              </Box>
            )}

            {tab === 'rights' && (
              <Box>
                <EntityManagement
                  filteringProgramId={selectedEntity.id}
                  hideTitle
                  entityType={entityType}
                />
              </Box>
            )}

            {tab === 'configurations' && entityType === 'program' && (
              <Box>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  <Box sx={{ mb: !configurationsAcknowledged ? 2 : 0 }}>
                    {t('programOverviewPage:configurationsWarning')}
                  </Box>
                  {!configurationsAcknowledged && (
                    <Button
                      variant="contained"
                      onClick={() => setConfigurationsAcknowledged(true)}
                      data-testid="acknowledge-configurations-warning"
                    >
                      {t('programOverviewPage:configurationsAcknowledge')}
                    </Button>
                  )}
                </Alert>
                {configurationsAcknowledged && (
                  <ProgramConfigurations program={selectedEntity} />
                )}
              </Box>
            )}

            {tab === 'logs' && entityType === 'program' && (
              <Box>
                <SingleProgramLogs program={selectedEntity} />
              </Box>
            )}
          </Stack>
        </>
      )}
    </Box>
  )
}

export default EntityOverview
