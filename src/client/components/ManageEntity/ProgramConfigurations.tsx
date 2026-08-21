import { ChangeEvent, useState } from 'react'
import 'dayjs/locale/fi'
import dayjs from 'dayjs'
import { isEqual } from 'lodash-es'
import { DatePicker } from '@mui/x-date-pickers'
import {
  Button,
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
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
import { StudyTrackData } from '@backend/validators/programResponse'
import { useUpdateProgramMutation } from '../../hooks/usePrograms'
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined'
import { useTranslation } from 'react-i18next'
import { TranslationLanguage } from '@backend/validators/departmentResponse'
import { ProgramData } from '@backend/validators/programResponse'

interface ProgramConfigurationsProps {
  program: ProgramData
}

// This helper strictly types the options map so that conditions can only reference valid sibling features
const createOptions = <T extends Record<string, any>>(opts: {
  [K in keyof T]: {
    type: 'boolean'
    conditions?: Partial<Record<keyof T, boolean>>
  }
}) => opts

export const PROGRAM_OPTIONS = createOptions({
  seminar: { type: 'boolean' },
  allowMultipleSeminarResponsibles: { type: 'boolean' },
  allowStudentStartedProcess: { type: 'boolean' },
  waysOfWorkingRequired: { type: 'boolean' },
  allowMultipleAuthors: { type: 'boolean' },
  hideSendToEthesis: { type: 'boolean' },
  useMilestones: { type: 'boolean' },
  disableStudyTracks: { type: 'boolean' },
  useIdleState: { type: 'boolean' },
  supervisorApproval: { type: 'boolean' },
  thesisProgramManagerNotRequired: { type: 'boolean' },
  allowStatusChanges: { type: 'boolean' },
  showEventLogs: { type: 'boolean' },
  isBachelorProgram: { type: 'boolean' },
  allowThesisWithoutSupervisor: {
    type: 'boolean',
    conditions: { supervisorOptional: true },
  },
  supervisorOptional: { type: 'boolean' },
})

export type BooleanOptionName = keyof typeof PROGRAM_OPTIONS
export type OptionCondition = Partial<Record<BooleanOptionName, boolean>>

interface FeatureFlagControlProps {
  isDateInput?: boolean
  program: ProgramData
  feature: BooleanOptionName | string
  conditions?: OptionCondition
  disabled?: boolean
  versioned?: boolean
  isMultilingualInput?: boolean
  singleValue?: boolean
  multiline?: boolean
}

interface OptionValue {
  value: string | Record<string, string> | null
}

interface VersionedOption {
  versions?: OptionValue[][]
}

const FeatureFlagControl = ({
  program,
  feature,
  conditions,
  disabled,
}: FeatureFlagControlProps) => {
  const { t: translation } = useTranslation()
  const updateMutation = useUpdateProgramMutation()
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

    const options = {
      ...(program.options || {}),
      [feature]: pendingValue,
      ...(pendingValue && conditions),
    }

    await updateMutation.mutateAsync({
      programId: program.id,
      options,
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
            disabled={updateMutation.isPending || disabled}
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

export type FeatureInputValue = {
  value: string | Record<string, string>
}

const FeatureInput = ({
  isDateInput = false,
  program,
  feature,
  versioned,
  isMultilingualInput = false,
  singleValue = false,
  multiline = false,
}: FeatureFlagControlProps) => {
  const { t: translation } = useTranslation()
  const updateMutation = useUpdateProgramMutation()
  const [values, setValues] = useState<FeatureInputValue[]>(() => {
    let initial =
      program.options && program.options[feature]
        ? versioned
          ? (program.options[feature] as VersionedOption).versions
            ? (program.options[feature] as VersionedOption).versions!.at(-1)
            : []
          : program.options[feature]
        : []

    if (singleValue) {
      const isEmpty =
        !initial || (Array.isArray(initial) && initial.length === 0)
      const defaultValue = isMultilingualInput ? { fi: '', sv: '', en: '' } : ''

      initial = isEmpty
        ? [{ value: defaultValue }]
        : Array.isArray(initial)
          ? initial
          : [{ value: initial }]
    }

    if (isMultilingualInput) {
      initial = initial.map((item: FeatureInputValue) => {
        const val = item.value
        if (typeof val === 'string') {
          return { value: { fi: val, sv: val, en: val } }
        }
        return item
      })
    }
    return initial
  })

  const [pendingValue, setPendingValue] = useState<FeatureInputValue[] | null>(
    null
  )

  const handleSave = () => {
    const validValues = isDateInput
      ? values.filter((v: FeatureInputValue) =>
          dayjs(v.value as string).isValid()
        )
      : values

    if (isDateInput && validValues.length !== values.length) {
      setValues(validValues)
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
      const featureOption = options[feature] as VersionedOption | undefined
      const currentVersions = featureOption?.versions || []
      const lastVersion =
        currentVersions.length > 0 ? currentVersions.at(-1) : []
      if (isEqual(pendingValue, lastVersion)) {
        setPendingValue(null)
        return
      }
    }
    if (versioned && !options[feature]) options[feature] = { versions: [] }
    if (versioned && !(options[feature] as VersionedOption).versions)
      (options[feature] as VersionedOption).versions = []
    if (versioned)
      (options[feature] as VersionedOption).versions!.push(pendingValue)
    else
      options[feature] =
        singleValue && pendingValue.length > 0
          ? pendingValue[0].value
          : pendingValue

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
        {values.map((value: FeatureInputValue, index: number) => {
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
                    value={value.value ? dayjs(value.value as string) : null}
                    format="DD.MM.YYYY"
                    onChange={(date) => {
                      setValues(
                        values.map((v: FeatureInputValue, i: number) => {
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
                    {!singleValue && (
                      <Typography variant="subtitle2">
                        {`${index + 1}. ${translation(`programOverviewPage:${feature}:fieldTitle`)}`}
                      </Typography>
                    )}
                    {['fi', 'sv', 'en'].map((lang) => (
                      <TextField
                        key={lang}
                        size="small"
                        variant="outlined"
                        label={lang.toUpperCase()}
                        value={
                          (value.value as Record<string, string>)?.[lang] || ''
                        }
                        onChange={(
                          event: React.ChangeEvent<HTMLInputElement>
                        ) => {
                          setValues(
                            values.map((v: FeatureInputValue, i: number) => {
                              if (i === index) {
                                return {
                                  ...v,
                                  value: {
                                    ...(v.value as Record<string, string>),
                                    [lang]: event.target.value,
                                  },
                                }
                              }
                              return v
                            })
                          )
                        }}
                        multiline={multiline}
                      />
                    ))}
                  </Stack>
                ) : (
                  <TextField
                    variant="outlined"
                    label={
                      singleValue
                        ? translation(
                            `programOverviewPage:${feature}:fieldTitle`
                          )
                        : `${index + 1}. ${translation(`programOverviewPage:${feature}:fieldTitle`)}`
                    }
                    value={value.value}
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                      setValues(
                        values.map((v: FeatureInputValue, i: number) => {
                          return i == index ? { value: event.target.value } : v
                        })
                      )
                    }}
                    multiline={multiline}
                    sx={{
                      width: '100%',
                    }}
                  ></TextField>
                )}
                {!singleValue && (
                  <Stack sx={{ justifyContent: 'center' }}>
                    <Tooltip title={translation('deleteButton', 'Poista')}>
                      <IconButton
                        arial-label={translation('deleteButton', 'Poista')}
                        onClick={() => {
                          setValues(
                            values.filter(
                              (_v: FeatureInputValue, i: number) => i != index
                            )
                          )
                        }}
                        color="error"
                      >
                        <RemoveCircleOutlineOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
              </Stack>
            </Paper>
          )
        })}
        <Stack direction="row" sx={{ gap: '1rem' }}>
          <Button variant="contained" onClick={handleSave}>
            {translation('common:saveButton')}
          </Button>
          {!singleValue && (
            <Button
              variant="outlined"
              onClick={() => {
                setValues([
                  ...values,
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
          )}
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

const CombinedStudyTracksInput = ({ program }: { program: ProgramData }) => {
  const { t: translation } = useTranslation()
  const updateMutation = useUpdateProgramMutation()
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

  const forcedFeatures = Object.keys(PROGRAM_OPTIONS).reduce((acc, feature) => {
    const config = PROGRAM_OPTIONS[feature as BooleanOptionName]
    if (config.type === 'boolean') {
      const isActive = program.options?.[feature] === true
      if (isActive && config.conditions) {
        Object.keys(config.conditions).forEach((target) => acc.add(target))
      }
    }
    return acc
  }, new Set<string>())

  const featureFlagUI = Object.keys(PROGRAM_OPTIONS).map((feature) => {
    const config = PROGRAM_OPTIONS[feature as BooleanOptionName]
    if (config.type === 'boolean') {
      const isForced = forcedFeatures.has(feature)

      return (
        <FeatureFlagControl
          program={program}
          feature={feature}
          key={feature}
          conditions={config.conditions}
          disabled={isForced}
        ></FeatureFlagControl>
      )
    }
    return null
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
          <Stack spacing={1}>
            <Typography variant="h5">
              {t(`programOverviewPage:milestones:title`)}
            </Typography>
            <Typography variant="body1">
              {t(`programOverviewPage:milestones:description`)}
            </Typography>
            <FeatureInput
              feature="milestones"
              isMultilingualInput
              program={program}
              versioned
            />
          </Stack>
        )}

        <Stack spacing={1}>
          <Typography variant="h5">
            {t(`programOverviewPage:targetDates:title`)}
          </Typography>
          <Typography variant="body1">
            {t(`programOverviewPage:targetDates:description`)}
          </Typography>
          <FeatureInput
            isDateInput={true}
            feature="targetDates"
            program={program}
          />
        </Stack>

        {Boolean(program.studyTracks?.length) && (
          <CombinedStudyTracksInput program={program} />
        )}

        <Typography variant="h5">
          {t(`programOverviewPage:helperTexts`)}
        </Typography>

        <Stack spacing={1}>
          <Typography variant="h6">
            {t(`programOverviewPage:generalHelperText:title`)}
          </Typography>
          <Typography variant="body1">
            {t(`programOverviewPage:generalHelperText:description`)}
          </Typography>
          <FeatureInput
            feature="generalHelperText"
            isMultilingualInput
            singleValue
            multiline
            program={program}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="h6">
            {t(`programOverviewPage:supervisorHelperText:title`)}
          </Typography>
          <Typography variant="body1">
            {t(`programOverviewPage:supervisorHelperText:description`)}
          </Typography>
          <FeatureInput
            feature="supervisorHelperText"
            isMultilingualInput
            singleValue
            multiline
            program={program}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="h6">
            {t(`programOverviewPage:seminarSupervisorHelperText:title`)}
          </Typography>
          <Typography variant="body1">
            {t(`programOverviewPage:seminarSupervisorHelperText:description`)}
          </Typography>
          <FeatureInput
            feature="seminarSupervisorHelperText"
            isMultilingualInput
            singleValue
            multiline
            program={program}
          />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="h6">
            {t(`programOverviewPage:topicDescriptionHelperText:title`)}
          </Typography>
          <Typography variant="body1">
            {t(`programOverviewPage:topicDescriptionHelperText:description`)}
          </Typography>
          <FeatureInput
            feature="topicDescriptionHelperText"
            isMultilingualInput
            singleValue
            multiline
            program={program}
          />
        </Stack>

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

const ProgramConfigurationsWithWarning = ({
  program,
}: ProgramConfigurationsProps) => {
  const { t } = useTranslation()
  const [configurationsAcknowledged, setConfigurationsAcknowledged] =
    useState(false)

  return (
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
        <ProgramConfigurations program={program} />
      )}
    </Box>
  )
}

export default ProgramConfigurationsWithWarning
