import { useState } from 'react'
import { ZodIssue } from 'zod'
import 'dayjs/locale/fi'
import dayjs from 'dayjs'
import { sortBy } from 'lodash-es'
import { useTranslation } from 'react-i18next'
import { useSelector } from '@tanstack/react-form'

import { EmployeeUser as User } from '@backend/validators/userResponse'
import { TranslationLanguage } from '@backend/validators/departmentResponse'
import { ThesisData } from '@backend/validators/thesisResponse'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import {
  Autocomplete,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import useUsers from '../../hooks/useUsers'
import {
  parseMilestoneDescription,
  hasMilestones,
  programHasMilestones,
  resolveMilestoneVersionIndex,
} from '../../../shared/utils/thesisUtils'
import { useDebounce } from '../../hooks/useDebounce'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import useProgramManagements from '../../hooks/useProgramManagements'
import {
  getPersonSelectionDefaults,
  createThesisSchema,
  ThesisSchema,
  ValidatedThesis,
} from './thesisValidator'

import ErrorSummary from '../Common/ErrorSummary'
import Markdown from '../Common/Markdown'
import AlertBox from '../Common/AlertBox'
import { ProgramData as Program } from '@backend/validators/programResponse'
import { StatusLocale } from '../../types'
import FileDropzone from './Dropzone/Dropzone'
import FilePreview from './Dropzone/FilePreview'
import TargetDateSelect from './TargetDateSelect'
import Popup from '../Common/Popup'

import PersonSelectionList from './PersonSelect/PersonSelectionList'
import { useAppForm } from './thesisFormContext'

interface ThesisEditFormProps {
  programs: Program[]
  formTitle: string
  initialThesis: ThesisData
  onClose: () => void
  onSubmit: (data: ThesisData) => Promise<void>
  isStudentView: boolean
}

const ThesisEditForm = ({
  programs,
  formTitle,
  initialThesis,
  onSubmit,
  onClose,
  isStudentView,
}: ThesisEditFormProps) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }

  const [formErrors, setFormErrors] = useState<ZodIssue[]>([])
  const [confirmSendOpen, setConfirmSendOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')

  const debouncedSearch = useDebounce(userSearch, 700)
  const { users: authorOptions } = useUsers({
    search: debouncedSearch,
    onlyWithStudyRight: true,
  })
  const { user } = useLoggedInUser()

  const form = useAppForm({
    defaultValues: (() => {
      const { _program, _studyTrack, ...rest } = initialThesis as any
      return rest as ThesisData
    })(),
    onSubmit: async ({ value }) => {
      const payload = getSubmitPayload(value)
      const { isValid, parsedThesis } = validateForm(payload)

      if (!isValid || !parsedThesis) {
        return
      }

      const finalPayload = { ...payload, ...parsedThesis }

      try {
        await onSubmit(finalPayload as ThesisData)
        setFormErrors([])
        clearURL()
      } catch (e: any) {
        const status = e?.response?.status || e?.status
        const errorMessage = status
          ? `${t('thesisForm:serverError')} (${status})`
          : t('thesisForm:serverUnreachableError')
        setFormErrors([{ code: 'custom', message: errorMessage, path: [] }])
      }
    },
  })

  // Watch current program id to fetch approvers
  const currentProgramId = useSelector(
    form.store,
    (state) => state.values.programId
  )

  const { programManagements: programManagementsOfApprovers } =
    useProgramManagements({
      onlyThesisApprovers: true,
      programId: currentProgramId,
      limitToEditorsPrograms: false,
    })

  const approvers = programManagementsOfApprovers?.map(
    (programManagement) => programManagement.user
  )

  const clearURL = () => {
    if (window.location.hash) {
      window.history.pushState('', document.title, window.location.pathname)
    }
  }

  const getSubmitPayload = (formValues: ThesisData) => {
    const currentProgram = programs.find((p) => p.id === formValues.programId)
    const programOptions = currentProgram?.options || {}
    const submitMilestoneVersionIndex = resolveMilestoneVersionIndex(
      formValues.milestoneVersion,
      programOptions
    )

    const payload = { ...formValues }

    if (programOptions.thesisProgramManagerNotRequired) {
      payload.approvers = []
    }

    if (
      programOptions.disableStudyTracks ||
      !currentProgram?.studyTracks?.length
    ) {
      payload.studyTrackId = null
    }

    if (!programOptions.seminar) {
      payload.seminarSupervisions = []
    }

    if (
      currentProgram &&
      submitMilestoneVersionIndex >= 0 &&
      hasMilestones(programOptions, submitMilestoneVersionIndex) &&
      (payload.milestone == null || payload.milestone === undefined)
    ) {
      payload.milestone = 0
      payload.milestoneVersion = submitMilestoneVersionIndex
    } else if (submitMilestoneVersionIndex === -1) {
      payload.milestone = null
      payload.milestoneVersion = null
    }

    if (payload.graders) {
      payload.graders = payload.graders.map((g, i) => ({
        ...getPersonSelectionDefaults('grader', i, payload.graders!.length),
        ...g,
      }))
    }

    if (payload.supervisions) {
      payload.supervisions = payload.supervisions.map((s, i) => ({
        ...getPersonSelectionDefaults(
          'supervisor',
          i,
          payload.supervisions!.length
        ),
        ...s,
      }))
    }

    if (payload.seminarSupervisions) {
      payload.seminarSupervisions = payload.seminarSupervisions.map((s, i) => ({
        ...getPersonSelectionDefaults(
          'seminarSupervisor',
          i,
          payload.seminarSupervisions!.length
        ),
        ...s,
      }))
    }

    return payload
  }

  const selectedProgram =
    programs && programs.find((program) => program.id === currentProgramId)

  function validateForm(payload: Partial<ThesisData>): {
    isValid: boolean
    parsedThesis?: ValidatedThesis
    thesisErrors: ZodIssue[]
  } {
    const options = {
      hasApprovers: Boolean(
        approvers?.length &&
        !selectedProgram?.options?.thesisProgramManagerNotRequired
      ),
      seminarSupervisionRequired: Boolean(selectedProgram?.options?.seminar),
      allowMultipleSeminarResponsibles: Boolean(
        selectedProgram?.options?.allowMultipleSeminarResponsibles
      ),
      waysOfWorkingRequired: Boolean(
        selectedProgram?.options?.waysOfWorkingRequired
      ),
      isStudentView,
      supervisionRequired: !(
        (selectedProgram?.options?.allowThesisWithoutSupervisor &&
          isStudentView) ||
        selectedProgram?.options?.supervisorOptional
      ),
      gradersRequired: !(
        Boolean(selectedProgram?.options?.supervisorOptional) &&
        (!payload.supervisions || payload.supervisions.length === 0)
      ),
    }

    const schema = createThesisSchema(options)
    const result = schema.safeParse(payload)
    const validatedThesis = ThesisSchema.safeParse(payload)

    const thesisErrors = result.success ? [] : result.error.issues
    const parsedThesis = validatedThesis.success
      ? validatedThesis.data
      : undefined

    if (thesisErrors.length > 0 || !parsedThesis) {
      setFormErrors(thesisErrors)

      // Also map some common errors to fields
      thesisErrors.forEach((err) => {
        if (err.path && err.path.length > 0 && err.path[0] !== 'general') {
          const fieldStr = err.path.join('.')
          // We could theoretically use form.setError here but setting it in state is easier for Summary
          form.setFieldMeta(fieldStr as any, (meta) => ({
            ...meta,
            errors: [err.message],
          }))
        }
      })
      return { isValid: false, parsedThesis: undefined, thesisErrors }
    }

    return { isValid: true, parsedThesis, thesisErrors: [] }
  }

  const allowMultipleAuthors = Boolean(
    selectedProgram?.options?.allowMultipleAuthors
  )
  const maxGraders = Number(selectedProgram?.options?.numberOfGraders) || 2
  const favoritePrograms = programs.filter((program) => program.isFavorite)
  const otherPrograms = programs.filter((program) => !program.isFavorite)

  const sortedStudyTracks =
    selectedProgram && selectedProgram.studyTracks?.length
      ? sortBy(
          selectedProgram?.studyTracks,
          (studyTrack) => studyTrack.name[language]
        )
      : []

  const allowStatusChanges = Boolean(
    selectedProgram?.options?.allowStatusChanges
  )
  const canChangeStatus = !isStudentView && (user.isAdmin || allowStatusChanges)

  const currentStatus = useSelector(form.store, (state) => state.values.status)

  const showStatusForm =
    !isStudentView &&
    (canChangeStatus ||
      ['IN_PROGRESS', 'CANCELLED'].includes(initialThesis.status))

  const isProgramUsingMilestones = programHasMilestones(
    selectedProgram?.options
  )
  const milestoneVersionIndex = resolveMilestoneVersionIndex(
    useSelector(form.store, (state) => state.values.milestoneVersion),
    selectedProgram?.options
  )
  const programMilestones =
    milestoneVersionIndex >= 0
      ? selectedProgram?.options?.milestones?.versions?.[
          milestoneVersionIndex
        ] || []
      : []

  const currentStartDate = useSelector(
    form.store,
    (state) => state.values.startDate
  )

  const showMilestoneForm = Boolean(canChangeStatus && isProgramUsingMilestones)
  const hasMultipleMilestoneVersions = Boolean(
    isProgramUsingMilestones &&
    selectedProgram?.options?.milestones?.versions?.length > 1
  )

  const isOptionNative = {
    DRAFT: Boolean(
      canChangeStatus && selectedProgram?.options?.allowStudentStartedProcess
    ),
    SUGGESTED: Boolean(
      canChangeStatus && selectedProgram?.options?.allowStudentStartedProcess
    ),
    PLANNING: Boolean(
      canChangeStatus && !selectedProgram?.options?.allowStudentStartedProcess
    ),
    IN_PROGRESS: Boolean(
      canChangeStatus || ['IN_PROGRESS', 'CANCELLED'].includes(currentStatus)
    ),
    ETHESIS_SENT: Boolean(
      canChangeStatus &&
      !selectedProgram?.options?.hideSendToEthesis &&
      !selectedProgram?.options?.allowStudentStartedProcess
    ),
    ETHESIS: Boolean(canChangeStatus),
    COMPLETED: Boolean(user.isAdmin),
    CANCELLED: true,
  }

  const showOption = Object.fromEntries(
    Object.entries(isOptionNative).map(([key, value]) => [
      key,
      value || currentStatus === key,
    ])
  ) as Record<keyof typeof isOptionNative, boolean>

  const handleProgramChange = (newProgramId: string) => {
    const newProgram = programs.find((program) => program.id === newProgramId)
    const newAllowMultipleAuthors = Boolean(
      newProgram?.options?.allowMultipleAuthors
    )
    const newMaxGraders = Number(newProgram?.options?.numberOfGraders) || 2
    const newStudyTracks = newProgram?.studyTracks || []
    const disableStudyTracks = Boolean(newProgram?.options?.disableStudyTracks)
    const firstAvailableStatus = newProgram?.options?.allowStudentStartedProcess
      ? 'DRAFT'
      : 'PLANNING'

    const oldValues = form.store.state.values
    form.setFieldValue('programId', newProgramId)
    form.setFieldValue('status', firstAvailableStatus)

    form.setFieldValue(
      'studyTrackId',
      disableStudyTracks || newStudyTracks.length === 0
        ? ''
        : newStudyTracks.some((st) => st.id === oldValues.studyTrackId)
          ? oldValues.studyTrackId
          : newStudyTracks[0]?.id || ''
    )

    form.setFieldValue(
      'authors',
      newAllowMultipleAuthors
        ? oldValues.authors
        : oldValues.authors.slice(0, 1)
    )
    form.setFieldValue('graders', oldValues.graders.slice(0, newMaxGraders))
    form.setFieldValue('milestone', undefined)
    form.setFieldValue('milestoneVersion', undefined)

    setFormErrors(formErrors.filter((error) => error.path[0] !== 'programId'))
  }

  const submitStudentDraft = async () => {
    form.setFieldValue('status', 'DRAFT')
    await form.handleSubmit()
  }

  const submitStudentSuggested = async () => {
    form.setFieldValue('status', 'SUGGESTED')
    await form.handleSubmit()
  }

  const handleSubmitWrapper = async () => {
    if (isStudentView) {
      // On student view submit button, we want to change status to SUGGESTED
      // But we need to validate first
      const payload = getSubmitPayload(form.store.state.values)
      const { isValid } = validateForm(payload)

      if (!isValid) {
        return
      }

      setConfirmSendOpen(true)
    } else {
      await form.handleSubmit()
    }
  }

  const handleClose = (
    _?: object,
    reason?: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (reason === 'backdropClick') return
    clearURL()
    onClose()
  }

  return (
    <form.AppForm>
      <>
        <Popup
          open
          fullWidth
          maxWidth="lg"
          onClose={handleClose}
          title={formTitle}
          titleProps={{ 'data-testid': 'thesis-form-title' }}
          onSubmit={handleSubmitWrapper}
          extraActionsLeft={
            isStudentView ? (
              <Button onClick={submitStudentDraft} color="inherit">
                {t('viewThesisFooter:saveAsDraftButton')}
              </Button>
            ) : null
          }
          submitText={
            isStudentView
              ? t('viewThesisFooter:sendDraftButton')
              : t('submitButton')
          }
          submitButtonProps={{ 'data-testid': 'submit-button' } as any}
          cancelText={t('cancelButton')}
          onCancel={() => {
            clearURL()
            onClose()
          }}
        >
          {formErrors.length > 0 && (
            <ErrorSummary autofocus label={t('thesisForm:errorSummary')}>
              {formErrors.map((error, index) => (
                <li
                  data-testid={`errorsummary-${error.path.join('-')}`}
                  key={`error-${error.path.join('-')}-${error.message}`}
                >
                  {`${t('common:error')} ${index + 1}: `}
                  <a href={`#${error.path.join('-')}`}>{t(error.message)}</a>
                </li>
              ))}
            </ErrorSummary>
          )}

          <Stack spacing={3}>
            {selectedProgram?.options?.generalHelperText?.[language] && (
              <AlertBox
                severity="info"
                title={t('thesisForm:generalHelperTextTitle')}
              >
                <Markdown>
                  {
                    selectedProgram.options.generalHelperText[
                      language
                    ] as string
                  }
                </Markdown>
              </AlertBox>
            )}

            <Stack
              spacing={3}
              sx={{
                borderStyle: 'none',
                borderWidth: '1px',
                borderTop: '1px solid',
              }}
              component="fieldset"
            >
              <Typography component="legend" sx={{ px: '1rem' }}>
                {t('thesisForm:basicInfo')}
              </Typography>

              <form.Field name="topic">
                {(field) => (
                  <TextField
                    data-testid="topic-select-input"
                    autoFocus
                    required
                    margin="dense"
                    id="topic"
                    name="topic"
                    label={t('topicHeader')}
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      setFormErrors(
                        formErrors.filter((error) => error.path[0] !== 'topic')
                      )
                    }}
                    error={
                      formErrors.some((error) => error.path[0] === 'topic') ||
                      field.state.meta.errors.length > 0
                    }
                    helperText={
                      t(
                        formErrors.find((error) => error.path[0] === 'topic')
                          ?.message
                      ) ||
                      (field.state.meta.errors.length > 0
                        ? t(field.state.meta.errors[0] as string)
                        : '')
                    }
                    fullWidth
                    variant="outlined"
                  />
                )}
              </form.Field>

              <form.Field name="programId">
                {(field) => (
                  <FormControl fullWidth>
                    <InputLabel id="program-select-label">{`${t('programHeader')}*`}</InputLabel>
                    <Select
                      data-testid="program-select-input"
                      required
                      value={field.state.value}
                      id="programId"
                      label="Program"
                      name="programId"
                      onChange={(e) =>
                        handleProgramChange(e.target.value as string)
                      }
                      error={
                        formErrors.some(
                          (error) => error.path[0] === 'programId'
                        ) || field.state.meta.errors.length > 0
                      }
                      renderValue={(value) =>
                        programs.find((program) => program.id === value)?.name[
                          language
                        ]
                      }
                    >
                      {favoritePrograms.map((program) => (
                        <MenuItem
                          data-testid={`program-select-item-${program.id}`}
                          key={program.id}
                          value={program.id}
                        >
                          <ListItemIcon>
                            <BookmarkIcon fontSize="small" color="primary" />
                          </ListItemIcon>
                          <ListItemText primary={program.name[language]} />
                        </MenuItem>
                      ))}
                      {otherPrograms.map((program) => (
                        <MenuItem
                          data-testid={`program-select-item-${program.id}`}
                          key={program.id}
                          value={program.id}
                        >
                          <ListItemText
                            inset
                            primary={program.name[language]}
                          />
                        </MenuItem>
                      ))}
                    </Select>
                    <FormHelperText error>
                      {t(
                        formErrors.find(
                          (error) => error.path[0] === 'programId'
                        )?.message
                      ) ||
                        (field.state.meta.errors.length > 0
                          ? t(field.state.meta.errors[0] as string)
                          : '')}
                    </FormHelperText>
                  </FormControl>
                )}
              </form.Field>

              {Boolean(
                selectedProgram &&
                selectedProgram.studyTracks?.length &&
                !selectedProgram.options?.disableStudyTracks
              ) && (
                <form.Field name="studyTrackId">
                  {(field) => (
                    <FormControl fullWidth>
                      <InputLabel id="study-track-select-label">
                        {t('studyTrackHeader')}
                      </InputLabel>
                      <Select
                        data-testid="study-track-select-input"
                        required
                        value={field.state.value ?? ''}
                        id="studyTrackId"
                        label="Study Track"
                        name="studyTrackId"
                        onChange={(e) => {
                          field.handleChange(e.target.value as string)
                          setFormErrors(
                            formErrors.filter(
                              (error) => error.path[0] !== 'studyTrackId'
                            )
                          )
                        }}
                        error={
                          formErrors.some(
                            (error) => error.path[0] === 'studyTrackId'
                          ) || field.state.meta.errors.length > 0
                        }
                      >
                        <MenuItem value="">
                          <em>{t('common:none')}</em>
                        </MenuItem>
                        {sortedStudyTracks.map((studyTrack) => (
                          <MenuItem key={studyTrack.id} value={studyTrack.id}>
                            {studyTrack.name[language]}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </form.Field>
              )}

              {!isStudentView &&
                approvers &&
                approvers.length > 0 &&
                !selectedProgram?.options?.thesisProgramManagerNotRequired && (
                  <form.Field name="approvers">
                    {(field) => (
                      <>
                        <AlertBox
                          id="approver-select-instructions"
                          severity="info"
                          title={t('thesisForm:approverInstructions')}
                        />
                        <FormControl fullWidth>
                          <InputLabel id="approver-select-label">{`${t('thesisForm:approverHeader')}*`}</InputLabel>
                          <Select
                            data-testid="approver-select-input"
                            required
                            value={
                              field.state.value?.length > 0
                                ? field.state.value[0]?.id
                                : ''
                            }
                            id="approver"
                            label="Approver"
                            name="approver"
                            onChange={(e) => {
                              field.handleChange([
                                approvers.find((a) => a.id === e.target.value),
                              ])
                              setFormErrors(
                                formErrors.filter(
                                  (error) => error.path[0] !== 'approver'
                                )
                              )
                            }}
                            error={
                              formErrors.some(
                                (error) =>
                                  error.path[0] === 'approver' ||
                                  error.path[0] === 'approvers'
                              ) || field.state.meta.errors.length > 0
                            }
                          >
                            {approvers.map((approver) => (
                              <MenuItem key={approver.id} value={approver.id}>
                                {approver.firstName} {approver.lastName}
                              </MenuItem>
                            ))}
                          </Select>
                          <FormHelperText error>
                            {t(
                              formErrors.find(
                                (error) =>
                                  error.path[0] === 'approver' ||
                                  error.path[0] === 'approvers'
                              )?.message
                            )}
                          </FormHelperText>
                        </FormControl>
                      </>
                    )}
                  </form.Field>
                )}

              <form.Field name="authors">
                {(field) => (
                  <FormControl fullWidth>
                    <Autocomplete<User, boolean>
                      id="authors"
                      noOptionsText={t('userSearchNoOptions')}
                      data-testid="author-select-input"
                      disablePortal
                      multiple={allowMultipleAuthors as any}
                      options={authorOptions ?? []}
                      getOptionLabel={(author: User) =>
                        `${author.firstName} ${author.lastName} ${author.email ? `(${author.email})` : ''} ${author.studentNumber ? `(${author.studentNumber})` : ''}`
                      }
                      inputValue={userSearch}
                      filterOptions={(x: any) => x}
                      isOptionEqualToValue={(option: User, value: User) =>
                        option.id === value.id
                      }
                      onInputChange={(_, value) => setUserSearch(value)}
                      value={
                        allowMultipleAuthors
                          ? field.state.value
                          : ((field.state.value.length > 0
                              ? field.state.value[0]
                              : null) as any)
                      }
                      onChange={(_, value) => {
                        field.handleChange(
                          allowMultipleAuthors
                            ? (value as User[])
                            : value
                              ? [value as User]
                              : []
                        )
                        setFormErrors(
                          formErrors.filter(
                            (error) => error.path[0] !== 'authors'
                          )
                        )
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={
                            allowMultipleAuthors
                              ? t('authorsHeader')
                              : t('author')
                          }
                          required={field.state.value.length === 0}
                          error={
                            formErrors.some(
                              (error) => error.path[0] === 'authors'
                            ) || field.state.meta.errors.length > 0
                          }
                          helperText={
                            t(
                              formErrors.find(
                                (error) => error.path[0] === 'authors'
                              )?.message
                            ) ||
                            (field.state.meta.errors.length > 0
                              ? t(field.state.meta.errors[0] as string)
                              : '')
                          }
                        />
                      )}
                    />
                  </FormControl>
                )}
              </form.Field>

              {showStatusForm ? (
                <form.Field name="status">
                  {(field) => (
                    <FormControl fullWidth>
                      <InputLabel id="status-select-label">
                        {t('statusHeader')}
                      </InputLabel>
                      <Select
                        data-testid="status-select-input"
                        required
                        value={field.state.value}
                        label={t('statusHeader')}
                        id="status"
                        name="status"
                        onChange={(e) => {
                          field.handleChange(
                            e.target.value as ThesisData['status']
                          )
                          setFormErrors(
                            formErrors.filter(
                              (error) => error.path[0] !== 'status'
                            )
                          )
                        }}
                        error={
                          formErrors.some(
                            (error) => error.path[0] === 'status'
                          ) || field.state.meta.errors.length > 0
                        }
                      >
                        {[
                          'DRAFT',
                          'SUGGESTED',
                          'PLANNING',
                          'IN_PROGRESS',
                          'ETHESIS_SENT',
                          'ETHESIS',
                          'COMPLETED',
                        ].map(
                          (opt) =>
                            showOption[opt as keyof typeof showOption] && (
                              <MenuItem key={opt} value={opt}>
                                {t(
                                  opt === 'ETHESIS' &&
                                    selectedProgram?.options
                                      ?.allowStudentStartedProcess
                                    ? 'thesisStages:ethesis_studentstarted'
                                    : StatusLocale[
                                        opt as keyof typeof StatusLocale
                                      ]
                                )}
                                {!isOptionNative[
                                  opt as keyof typeof isOptionNative
                                ] && t('thesisForm:notInCurrentProgram')}
                              </MenuItem>
                            )
                        )}
                        <MenuItem value="CANCELLED">
                          {t(StatusLocale.CANCELLED)}
                        </MenuItem>
                      </Select>
                      <FormHelperText error>
                        {t(
                          formErrors.find((error) => error.path[0] === 'status')
                            ?.message
                        ) ||
                          (field.state.meta.errors.length > 0
                            ? t(field.state.meta.errors[0] as string)
                            : '')}
                      </FormHelperText>
                    </FormControl>
                  )}
                </form.Field>
              ) : (
                <form.Field name="status">
                  {(field) => (
                    <FormControl fullWidth>
                      <Typography
                        variant="body2"
                        color="textSecondary"
                        sx={{ mb: 1 }}
                      >
                        {t('statusHeader')}
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {t(
                          StatusLocale[
                            field.state.value as keyof typeof StatusLocale
                          ]
                        )}
                      </Typography>
                    </FormControl>
                  )}
                </form.Field>
              )}

              {showMilestoneForm && (
                <>
                  {hasMultipleMilestoneVersions && (
                    <AlertBox severity="warning">
                      {t('thesisForm:milestoneVersionWarning')}
                    </AlertBox>
                  )}
                  <Stack spacing={2} direction={{ xs: 'column', md: 'row' }}>
                    <form.Field name="milestoneVersion">
                      {(field) => (
                        <Tooltip
                          title={t('thesisForm:milestoneVersionTooltip')}
                          placement="top"
                        >
                          <FormControl fullWidth>
                            <InputLabel id="milestone-version-select-label">
                              {t('thesisForm:milestoneVersion')}
                            </InputLabel>
                            <Select
                              data-testid="milestone-version-select-input"
                              value={field.state.value ?? milestoneVersionIndex}
                              label={t('thesisForm:milestoneVersion')}
                              id="milestoneVersion"
                              name="milestoneVersion"
                              onChange={(e) => {
                                const val = Number(e.target.value)
                                field.handleChange(val === -1 ? null : val)
                                form.setFieldValue(
                                  'milestone',
                                  val === -1 ? null : 0
                                )
                              }}
                            >
                              <MenuItem value={-1}>
                                {t('thesisForm:noMilestoneVersion')}
                              </MenuItem>
                              {selectedProgram?.options?.milestones?.versions?.map(
                                (_: any, index: number) => (
                                  <MenuItem key={index} value={index}>
                                    {t('thesisForm:version')} {index + 1}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        </Tooltip>
                      )}
                    </form.Field>

                    {milestoneVersionIndex !== -1 && (
                      <form.Field name="milestone">
                        {(field) => (
                          <FormControl fullWidth>
                            <InputLabel id="milestone-select-label">
                              {t('progressView:milestone')}
                            </InputLabel>
                            <Select
                              data-testid="milestone-select-input"
                              value={field.state.value ?? 0}
                              label={t('progressView:milestone')}
                              id="milestone"
                              name="milestone"
                              onChange={(e) =>
                                field.handleChange(Number(e.target.value))
                              }
                            >
                              <MenuItem value={0}>0</MenuItem>
                              {programMilestones.map(
                                (milestone: any, index: number) => (
                                  <MenuItem
                                    key={index}
                                    value={index + 1}
                                  >{`${index + 1}: ${parseMilestoneDescription(milestone.value, language)}`}</MenuItem>
                                )
                              )}
                            </Select>
                          </FormControl>
                        )}
                      </form.Field>
                    )}
                  </Stack>
                </>
              )}

              <Grid container rowSpacing={{ xs: 2, md: 0 }}>
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{ paddingLeft: { md: '1rem' } }}
                >
                  <form.Field name="startDate">
                    {(field) => (
                      <DatePicker
                        label={t('startDateHeader')}
                        slotProps={{
                          textField: {
                            id: 'startDate',
                            helperText:
                              t(
                                formErrors.find(
                                  (error) => error.path[0] === 'startDate'
                                )?.message
                              ) ||
                              (field.state.meta.errors.length > 0
                                ? t(field.state.meta.errors[0] as string)
                                : 'DD.MM.YYYY'),
                            fullWidth: true,
                            error:
                              formErrors.some(
                                (error) => error.path[0] === 'startDate'
                              ) || field.state.meta.errors.length > 0,
                          },
                        }}
                        name="startDate"
                        value={dayjs(field.state.value)}
                        format="DD.MM.YYYY"
                        onChange={(date) => {
                          field.handleChange(
                            date ? date.format('YYYY-MM-DD') : ''
                          )
                          setFormErrors(
                            formErrors.filter(
                              (error) => error.path[0] !== 'startDate'
                            )
                          )
                        }}
                      />
                    )}
                  </form.Field>
                </Grid>
                <Grid
                  size={{ xs: 12, md: 6 }}
                  sx={{ paddingLeft: { md: '1rem' } }}
                >
                  <form.Field name="targetDate">
                    {(field) => (
                      <TargetDateSelect
                        targetDates={
                          (selectedProgram?.options?.targetDates as {
                            value: string
                          }[]) || []
                        }
                        targetDate={field.state.value}
                        startDate={currentStartDate}
                        formErrors={formErrors}
                        onChange={(date) => field.handleChange(date)}
                        onClearError={() =>
                          setFormErrors(
                            formErrors.filter(
                              (error) => error.path[0] !== 'targetDate'
                            )
                          )
                        }
                      />
                    )}
                  </form.Field>
                </Grid>
              </Grid>
            </Stack>

            {!(
              selectedProgram?.options?.allowThesisWithoutSupervisor &&
              isStudentView
            ) && (
              <Stack
                sx={
                  isStudentView
                    ? { '.percentage-input-field': { display: 'none' } }
                    : {}
                }
              >
                <form.Field name="supervisions">
                  {(field) => (
                    <PersonSelectionList
                      type="supervisor"
                      field={field}
                      disabledMode={false}
                      allowEmpty={Boolean(
                        selectedProgram?.options?.supervisorOptional
                      )}
                      helperTextNode={
                        selectedProgram?.options?.supervisorHelperText?.[
                          language
                        ] ? (
                          <AlertBox
                            severity="info"
                            sx={{ mb: 2 }}
                            title={t('thesisForm:supervisorHelperTextTitle')}
                          >
                            <Markdown>
                              {
                                selectedProgram.options.supervisorHelperText[
                                  language
                                ] as string
                              }
                            </Markdown>
                          </AlertBox>
                        ) : undefined
                      }
                      generalErrors={formErrors
                        .filter((e) =>
                          e.path.join('-').endsWith('general-supervisor-error')
                        )
                        .map((e) => e.message)}
                    />
                  )}
                </form.Field>
              </Stack>
            )}

            {Boolean(selectedProgram?.options?.seminar) && (
              <form.Field name="seminarSupervisions">
                {(field) => (
                  <PersonSelectionList
                    type="seminarSupervisor"
                    field={field}
                    allowMultiple={Boolean(
                      selectedProgram?.options?.allowMultipleSeminarResponsibles
                    )}
                    helperTextNode={
                      selectedProgram?.options?.seminarSupervisorHelperText?.[
                        language
                      ] ? (
                        <AlertBox
                          severity="info"
                          sx={{ mb: 2 }}
                          title={t(
                            'thesisForm:seminarSupervisorHelperTextTitle'
                          )}
                        >
                          <Markdown>
                            {
                              selectedProgram.options
                                .seminarSupervisorHelperText[language] as string
                            }
                          </Markdown>
                        </AlertBox>
                      ) : undefined
                    }
                    generalErrors={formErrors
                      .filter((e) =>
                        e.path
                          .join('-')
                          .endsWith('general-seminar-supervisor-error')
                      )
                      .map((e) => e.message)}
                  />
                )}
              </form.Field>
            )}

            {!isStudentView && (
              <form.Field name="graders">
                {(field) => (
                  <form.Subscribe
                    selector={(state) => state.values.supervisions}
                  >
                    {(supervisions) => (
                      <PersonSelectionList
                        type="grader"
                        field={field}
                        maxItems={Number(maxGraders)}
                        allowEmpty={
                          Boolean(
                            selectedProgram?.options?.supervisorOptional
                          ) &&
                          (!supervisions || supervisions.length === 0)
                        }
                        helperTextNode={
                          <AlertBox
                            id="grader-select-instructions"
                            severity="info"
                            title={t('thesisForm:graderInstructions:title')}
                          >
                            {t('thesisForm:graderInstructions:content1')}
                            {Number(maxGraders) > 1 && (
                              <>
                                {'\n\n'}
                                {t('thesisForm:graderInstructions:content2')}
                              </>
                            )}
                          </AlertBox>
                        }
                        generalErrors={formErrors
                          .filter((e) =>
                            e.path.join('-').endsWith('general-grader-error')
                          )
                          .map((e) => e.message)}
                      />
                    )}
                  </form.Subscribe>
                )}
              </form.Field>
            )}

            <Stack
              spacing={3}
              sx={{
                borderStyle: 'none',
                borderWidth: '1px',
                borderTop: '1px solid',
              }}
              component="fieldset"
            >
              <Typography component="legend" sx={{ px: '1rem' }}>
                {t('thesisForm:appendices')}
              </Typography>

              {selectedProgram?.options?.topicDescriptionHelperText?.[
                language
              ] && (
                <AlertBox
                  severity="info"
                  sx={{ mx: 2, mb: 2 }}
                  title={t('thesisForm:topicDescriptionInstructionsTitle')}
                >
                  <Markdown>
                    {
                      selectedProgram.options.topicDescriptionHelperText[
                        language
                      ] as string
                    }
                  </Markdown>
                </AlertBox>
              )}

              <form.Field name="researchPlan">
                {(field) => (
                  <>
                    <FileDropzone
                      id="researchPlan"
                      label={t('thesisForm:uploadResearchPlan')}
                      required
                      error={
                        formErrors.some(
                          (error) => error.path[0] === 'researchPlan'
                        ) || field.state.meta.errors.length > 0
                      }
                      helperText={
                        t(
                          formErrors.find(
                            (error) => error.path[0] === 'researchPlan'
                          )?.message
                        ) ||
                        (field.state.meta.errors.length > 0
                          ? t(field.state.meta.errors[0] as string)
                          : '')
                      }
                      uploadedFile={field.state.value}
                      handleFileUpload={(files) => {
                        field.handleChange(files[0])
                        setFormErrors(
                          formErrors.filter(
                            (error) => error.path[0] !== 'researchPlan'
                          )
                        )
                      }}
                      inputProps={{
                        'data-testid': 'research-plan-input',
                        accept: '.pdf',
                        type: 'file',
                      }}
                    />
                    {field.state.value && (
                      <FilePreview
                        file={field.state.value}
                        onDelete={() => field.handleChange(undefined)}
                      />
                    )}
                  </>
                )}
              </form.Field>

              <form.Field name="waysOfWorking">
                {(field) => (
                  <>
                    <FileDropzone
                      id="waysOfWorking"
                      label={t('thesisForm:uploadWaysOfWorking')}
                      required={Boolean(
                        selectedProgram?.options?.waysOfWorkingRequired
                      )}
                      error={
                        formErrors.some(
                          (error) => error.path[0] === 'waysOfWorking'
                        ) || field.state.meta.errors.length > 0
                      }
                      helperText={t('thesisForm:waysOfWorkingHelperText')}
                      uploadedFile={field.state.value}
                      handleFileUpload={(files) => {
                        field.handleChange(files[0])
                        setFormErrors(
                          formErrors.filter(
                            (error) => error.path[0] !== 'waysOfWorking'
                          )
                        )
                      }}
                      inputProps={{
                        'data-testid': 'ways-of-working-input',
                        accept: '.pdf',
                        type: 'file',
                      }}
                    />
                    {field.state.value && (
                      <FilePreview
                        file={field.state.value}
                        onDelete={() => {
                          field.handleChange(undefined)
                          form.setFieldValue('waysOfWorkingValidUntil', null)
                        }}
                      />
                    )}
                  </>
                )}
              </form.Field>

              <form.Subscribe
                selector={(state) => ({
                  wowRequired: Boolean(
                    selectedProgram?.options?.waysOfWorkingRequired
                  ),
                  wowVal: state.values.waysOfWorking,
                })}
              >
                {({ wowRequired, wowVal }) =>
                  (wowRequired || Boolean(wowVal)) && (
                    <form.Field name="waysOfWorkingValidUntil">
                      {(field) => (
                        <DatePicker
                          label={`${t('thesisForm:waysOfWorkingValidUntil')}*`}
                          slotProps={{
                            textField: {
                              id: 'waysOfWorkingValidUntil',
                              helperText:
                                t(
                                  formErrors.find(
                                    (error) =>
                                      error.path[0] ===
                                      'waysOfWorkingValidUntil'
                                  )?.message
                                ) ||
                                (field.state.meta.errors.length > 0
                                  ? t(field.state.meta.errors[0] as string)
                                  : 'DD.MM.YYYY'),
                              fullWidth: true,
                              error:
                                formErrors.some(
                                  (error) =>
                                    error.path[0] === 'waysOfWorkingValidUntil'
                                ) || field.state.meta.errors.length > 0,
                            },
                          }}
                          name="waysOfWorkingValidUntil"
                          value={
                            field.state.value ? dayjs(field.state.value) : null
                          }
                          format="DD.MM.YYYY"
                          onChange={(date) => {
                            field.handleChange(
                              date ? date.format('YYYY-MM-DD') : null
                            )
                            setFormErrors(
                              formErrors.filter(
                                (error) =>
                                  error.path[0] !== 'waysOfWorkingValidUntil'
                              )
                            )
                          }}
                        />
                      )}
                    </form.Field>
                  )
                }
              </form.Subscribe>
            </Stack>
          </Stack>
        </Popup>

        {isStudentView && (
          <Popup
            open={confirmSendOpen}
            onClose={() => setConfirmSendOpen(false)}
            title={t('viewThesisFooter:sendDraftButtonConfirmTitle')}
            onSubmit={async () => {
              setConfirmSendOpen(false)
              await submitStudentSuggested()
            }}
            submitText={t('viewThesisFooter:sendDraftButton')}
            cancelText={t('cancelButton')}
          >
            <Typography>
              {t('viewThesisFooter:sendDraftButtonConfirmContent')}
            </Typography>
          </Popup>
        )}
      </>
    </form.AppForm>
  )
}

export default ThesisEditForm
