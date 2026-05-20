import { useState, FC } from 'react'
import { ZodIssue } from 'zod'
import 'dayjs/locale/fi'
import dayjs from 'dayjs'
import { sortBy } from 'lodash-es'
import { useTranslation } from 'react-i18next'

import { User, ThesisData, TranslationLanguage } from '@backend/types'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import {
  Alert,
  AlertTitle,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers'
import SupervisorSelect from './SupervisorSelect/SupervisorSelect'
import useUsers from '../../hooks/useUsers'
import { useDebounce } from '../../hooks/useDebounce'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import useProgramManagements from '../../hooks/useProgramManagements'
import { getFormErrors } from './util'
import GraderSelect from './GraderSelect/GraderSelect'
import SeminarSupervisorSelect from './SeminarSupervisorSelect/SeminarSupervisorSelect'
import ErrorSummary from '../Common/ErrorSummary'
import { ProgramData as Program } from '../../../server/types'
import { StatusLocale } from '../../types'
import FileDropzone from './Dropzone/Dropzone'
import FilePreview from './Dropzone/FilePreview'

const ThesisEditForm: FC<{
  programs: Program[]
  formTitle: string
  initialThesis: ThesisData
  onClose: () => void
  onSubmit: (data: ThesisData) => Promise<void>
}> = ({ programs, formTitle, initialThesis, onSubmit, onClose }) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n as { language: TranslationLanguage }
  const [formErrors, setFormErrors] = useState<ZodIssue[]>([])
  const [editedThesis, setEditedThesis] = useState<ThesisData | null>(
    initialThesis
  )
  const [userSearch, setUserSearch] = useState('')
  const { programManagements: programManagementsOfApprovers } =
    useProgramManagements({
      onlyThesisApprovers: true,
      programId: editedThesis.programId,
      limitToEditorsPrograms: false,
    })
  const approvers = programManagementsOfApprovers?.map(
    (programManagement) => programManagement.user
  )

  const debouncedSearch = useDebounce(userSearch, 700)
  const { users: authorOptions } = useUsers({
    search: debouncedSearch,
    onlyWithStudyRight: true,
  })
  const { user } = useLoggedInUser()

  const clearURL = () => {
    if (window.location.hash) {
      window.history.pushState('', document.title, window.location.pathname)
    }
  }

  const handleSubmit = async () => {
    const thesisErrors = getFormErrors(
      editedThesis,
      approvers?.length > 0,
      Boolean(selectedProgram?.options?.seminar),
      Boolean(selectedProgram?.options?.allowMultipleSeminarResponsibles),
      Boolean(selectedProgram?.options?.waysOfWorkingRequired)
    )

    if (thesisErrors.length > 0) {
      setFormErrors(thesisErrors)
      return
    }

    await onSubmit(editedThesis)
    setFormErrors([])

    // Clear the hash location from the URL
    clearURL()
  }

  const handleClose = (
    _: object,
    reason: 'backdropClick' | 'escapeKeyDown'
  ) => {
    if (reason === 'backdropClick') return

    clearURL()
    onClose()
  }

  const selectedProgram =
    programs &&
    programs.find((program) => program.id === editedThesis.programId)

  const allowMultipleAuthors = Boolean(
    selectedProgram?.options?.allowMultipleAuthors
  )
  const maxGraders = Number(selectedProgram?.options?.numberOfGraders) || 2

  const favoritePrograms = programs.filter((program) => program.isFavorite)
  const otherPrograms = programs.filter((program) => !program.isFavorite)

  const sortedStudyTracks =
    selectedProgram && selectedProgram.studyTracks?.length
      ? sortBy(
          selectedProgram.studyTracks,
          (studyTrack) => studyTrack.name[language]
        )
      : []

  const thesisStatus = initialThesis.status

  const showStatusForm =
    user.isAdmin || ['IN_PROGRESS', 'CANCELLED'].includes(thesisStatus)

  const showOption = {
    DRAFT: user.isAdmin,
    SUGGESTED: user.isAdmin,
    PLANNING: user.isAdmin,
    IN_PROGRESS:
      user.isAdmin || ['IN_PROGRESS', 'CANCELLED'].includes(thesisStatus),
    ETHESIS_SENT: user.isAdmin,
    ETHESIS: user.isAdmin,
    COMPLETED: user.isAdmin,
  }

  return (
    <Dialog open fullWidth maxWidth="lg" onClose={handleClose}>
      <DialogTitle data-testid="thesis-form-title" component="h1">
        {formTitle}
      </DialogTitle>
      <DialogContent>
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
        <Stack spacing={6}>
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
            <TextField
              data-testid="topic-select-input"
              autoFocus
              required
              margin="dense"
              id="topic"
              name="topic"
              label={t('topicHeader')}
              value={editedThesis.topic}
              onChange={(event) => {
                setEditedThesis((oldThesis) => ({
                  ...oldThesis,
                  topic: event.target.value,
                }))

                setFormErrors(
                  formErrors.filter((error) => error.path[0] !== 'topic')
                )
              }}
              error={formErrors.some((error) => error.path[0] === 'topic')}
              helperText={t(
                formErrors.find((error) => error.path[0] === 'topic')?.message
              )}
              fullWidth
              variant="outlined"
            />

            <FormControl fullWidth>
              <InputLabel id="program-select-label">
                {`${t('programHeader')}*`}
              </InputLabel>
              <Select
                data-testid="program-select-input"
                required
                value={editedThesis.programId}
                id="programId"
                label="Program"
                name="programId"
                onChange={(event) => {
                  const newProgramId = event.target
                    .value as ThesisData['programId']
                  const newProgram = programs.find(
                    (program) => program.id === newProgramId
                  )
                  const newAllowMultipleAuthors = Boolean(
                    newProgram?.options?.allowMultipleAuthors
                  )
                  const newMaxGraders =
                    Number(newProgram?.options?.numberOfGraders) || 2

                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    programId: newProgramId,
                    studyTrackId: newProgram?.studyTracks?.[0]?.id,
                    authors: newAllowMultipleAuthors
                      ? oldThesis.authors
                      : oldThesis.authors.slice(0, 1),
                    graders: oldThesis.graders.slice(0, newMaxGraders),
                  }))

                  setFormErrors(
                    formErrors.filter((error) => error.path[0] !== 'programId')
                  )
                }}
                error={formErrors.some(
                  (error) => error.path[0] === 'programId'
                )}
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
                    <ListItemText inset primary={program.name[language]} />
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText error>
                {t(
                  formErrors.find((error) => error.path[0] === 'programId')
                    ?.message
                )}
              </FormHelperText>
            </FormControl>

            {Boolean(
              selectedProgram && selectedProgram.studyTracks?.length
            ) && (
              <FormControl fullWidth>
                <InputLabel id="study-track-select-label">
                  {t('studyTrackHeader')}
                </InputLabel>
                <Select
                  data-testid="study-track-select-input"
                  required
                  value={editedThesis.studyTrackId ?? ''}
                  id="studyTrackId"
                  label="Study Track"
                  name="studyTrackId"
                  onChange={(event) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      studyTrackId: event.target
                        .value as ThesisData['studyTrackId'],
                    }))

                    setFormErrors(
                      formErrors.filter(
                        (error) => error.path[0] !== 'studyTrackId'
                      )
                    )
                  }}
                  error={formErrors.some(
                    (error) => error.path[0] === 'studyTrackId'
                  )}
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

            {approvers && approvers.length > 0 && (
              <>
                <Alert
                  id="grader-select-instructions"
                  severity="info"
                  variant="outlined"
                  sx={{ whiteSpace: 'pre-line' }}
                >
                  <AlertTitle>
                    {t('thesisForm:approverInstructions')}
                  </AlertTitle>
                </Alert>
                <FormControl fullWidth>
                  <InputLabel id="approver-select-label">
                    {`${t('thesisForm:approverHeader')}*`}
                  </InputLabel>
                  <Select
                    data-testid="approver-select-input"
                    required
                    value={
                      editedThesis.approvers?.length > 0
                        ? editedThesis.approvers[0]?.id
                        : ''
                    }
                    id="approver"
                    label="Approver"
                    name="approver"
                    onChange={(event) => {
                      setEditedThesis((oldThesis) => ({
                        ...oldThesis,
                        approvers: [
                          approvers.find((a) => a.id === event.target.value),
                        ],
                      }))

                      setFormErrors(
                        formErrors.filter(
                          (error) => error.path[0] !== 'approver'
                        )
                      )
                    }}
                    error={formErrors.some(
                      (error) => error.path[0] === 'approver'
                    )}
                  >
                    {approvers.map((approver) => (
                      <MenuItem key={approver.id} value={approver.id}>
                        {approver.firstName} {approver.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText error>
                    {t(
                      formErrors.find((error) => error.path[0] === 'approver')
                        ?.message
                    )}
                  </FormHelperText>
                </FormControl>
              </>
            )}

            <FormControl fullWidth>
              {(() => {
                const commonAutocompleteProps = {
                  id: 'authors',
                  noOptionsText: t('userSearchNoOptions'),
                  'data-testid': 'author-select-input',
                  disablePortal: true,
                  options: authorOptions ?? [],
                  getOptionLabel: (author: User) =>
                    `${author.firstName} ${author.lastName} ${author.email ? `(${author.email})` : ''} ${author.studentNumber ? `(${author.studentNumber})` : ''}`,
                  inputValue: userSearch,
                  filterOptions: (x: any) => x,
                  isOptionEqualToValue: (option: User, value: User) =>
                    option.id === value.id,
                  onInputChange: (event: any, value: string) => {
                    setUserSearch(value)
                  },
                }

                const renderAuthorInput = (
                  params: any,
                  label: string,
                  isRequired: boolean
                ) => (
                  <TextField
                    {...params}
                    label={label}
                    required={isRequired}
                    error={formErrors.some(
                      (error) => error.path[0] === 'authors'
                    )}
                    helperText={t(
                      formErrors.find((error) => error.path[0] === 'authors')
                        ?.message
                    )}
                  />
                )

                if (allowMultipleAuthors) {
                  return (
                    <Autocomplete<User, true>
                      {...commonAutocompleteProps}
                      multiple
                      renderInput={(params) =>
                        renderAuthorInput(
                          params,
                          t('authorsHeader'),
                          editedThesis.authors.length === 0
                        )
                      }
                      value={editedThesis.authors}
                      onChange={(_, value) => {
                        setEditedThesis((oldThesis) => ({
                          ...oldThesis,
                          authors: value,
                        }))
                        setFormErrors(
                          formErrors.filter(
                            (error) => error.path[0] !== 'authors'
                          )
                        )
                      }}
                    />
                  )
                }

                return (
                  <Autocomplete<User>
                    {...commonAutocompleteProps}
                    renderInput={(params) =>
                      renderAuthorInput(params, t('author'), true)
                    }
                    value={
                      editedThesis.authors.length > 0
                        ? editedThesis.authors[0]
                        : null
                    }
                    onChange={(_, value) => {
                      setEditedThesis((oldThesis) => ({
                        ...oldThesis,
                        authors: value ? [value] : [],
                      }))
                      setFormErrors(
                        formErrors.filter(
                          (error) => error.path[0] !== 'authors'
                        )
                      )
                    }}
                  />
                )
              })()}
            </FormControl>

            {showStatusForm && (
              <FormControl fullWidth>
                <InputLabel id="status-select-label">
                  {t('statusHeader')}
                </InputLabel>
                <Select
                  data-testid="status-select-input"
                  required
                  disabled={
                    initialThesis.status === 'PLANNING' &&
                    !user.isAdmin &&
                    !user.managedProgramIds?.includes(editedThesis.programId)
                  }
                  value={editedThesis.status}
                  label={t('statusHeader')}
                  id="status"
                  name="status"
                  onChange={(event) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      status: event.target.value as ThesisData['status'],
                    }))

                    setFormErrors(
                      formErrors.filter((error) => error.path[0] !== 'status')
                    )
                  }}
                  error={formErrors.some((error) => error.path[0] === 'status')}
                >
                  {showOption['DRAFT'] && (
                    <MenuItem value="DRAFT">{t(StatusLocale.DRAFT)}</MenuItem>
                  )}
                  {showOption['SUGGESTED'] && (
                    <MenuItem value="SUGGESTED">
                      {t(StatusLocale.SUGGESTED)}
                    </MenuItem>
                  )}
                  {showOption['PLANNING'] && (
                    <MenuItem value="PLANNING">
                      {t(StatusLocale.PLANNING)}
                    </MenuItem>
                  )}
                  {showOption['IN_PROGRESS'] && (
                    <MenuItem value="IN_PROGRESS">
                      {t(StatusLocale.IN_PROGRESS)}
                    </MenuItem>
                  )}
                  {showOption['ETHESIS_SENT'] && (
                    <MenuItem value="ETHESIS_SENT">
                      {t(StatusLocale.ETHESIS_SENT)}
                    </MenuItem>
                  )}
                  {showOption['ETHESIS'] && (
                    <MenuItem value="ETHESIS">
                      {t(StatusLocale.ETHESIS)}
                    </MenuItem>
                  )}
                  {showOption['COMPLETED'] && (
                    <MenuItem value="COMPLETED">
                      {t(StatusLocale.COMPLETED)}
                    </MenuItem>
                  )}
                  <MenuItem value="CANCELLED">
                    {t(StatusLocale.CANCELLED)}
                  </MenuItem>
                </Select>
                <FormHelperText error>
                  {t(
                    formErrors.find((error) => error.path[0] === 'status')
                      ?.message
                  )}
                </FormHelperText>
              </FormControl>
            )}

            {!showStatusForm && (
              <FormControl fullWidth>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mb: 1 }}
                >
                  {t('statusHeader')}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 500 }}>
                  {t(StatusLocale[initialThesis.status])}
                </Typography>
              </FormControl>
            )}

            <Grid container rowSpacing={{ xs: 2, md: 0 }}>
              <Grid
                size={{ xs: 12, md: 6 }}
                sx={{ paddingLeft: { md: '1rem' } }}
              >
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
                        ) || 'DD.MM.YYYY',
                      fullWidth: true,
                      error: formErrors.some(
                        (error) => error.path[0] === 'startDate'
                      ),
                    },
                  }}
                  name="startDate"
                  value={dayjs(editedThesis.startDate)}
                  format="DD.MM.YYYY"
                  onChange={(date) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      startDate: date.format('YYYY-MM-DD'),
                    }))

                    setFormErrors(
                      formErrors.filter(
                        (error) => error.path[0] !== 'startDate'
                      )
                    )
                  }}
                />
              </Grid>
              <Grid
                size={{ xs: 12, md: 6 }}
                sx={{ paddingLeft: { md: '1rem' } }}
              >
                <DatePicker
                  label={t('targetDateHeader')}
                  slotProps={{
                    textField: {
                      id: 'targetDate',
                      helperText:
                        t(
                          formErrors.find(
                            (error) => error.path[0] === 'targetDate'
                          )?.message
                        ) || 'DD.MM.YYYY',
                      fullWidth: true,
                      error: formErrors.some(
                        (error) => error.path[0] === 'targetDate'
                      ),
                    },
                  }}
                  name="targetDate"
                  value={dayjs(editedThesis.targetDate)}
                  format="DD.MM.YYYY"
                  minDate={dayjs(editedThesis.startDate)}
                  onChange={(date) => {
                    setEditedThesis((oldThesis) => ({
                      ...oldThesis,
                      targetDate: date.format('YYYY-MM-DD'),
                    }))

                    setFormErrors(
                      formErrors.filter(
                        (error) => error.path[0] !== 'targetDate'
                      )
                    )
                  }}
                />
              </Grid>
            </Grid>
          </Stack>

          <SupervisorSelect
            errors={formErrors}
            setErrors={(errors) => setFormErrors(errors)}
            supervisorSelections={editedThesis.supervisions}
            setSupervisorSelections={(newSupervisions) =>
              setEditedThesis((oldThesis) => ({
                ...oldThesis,
                supervisions: newSupervisions,
              }))
            }
            disabledMode={false}
          />

          {Boolean(selectedProgram?.options?.seminar) && (
            <SeminarSupervisorSelect
              errors={formErrors}
              setErrors={(errors) => setFormErrors(errors)}
              seminarSupervisorSelections={
                editedThesis.seminarSupervisions ?? []
              }
              setSeminarSupervisorSelections={(seminarSupervisions) =>
                setEditedThesis((oldThesis) => ({
                  ...oldThesis,
                  seminarSupervisions,
                }))
              }
              allowMultiple={Boolean(
                selectedProgram?.options?.allowMultipleSeminarResponsibles
              )}
            />
          )}
          <GraderSelect
            errors={formErrors}
            setErrors={(errors) => setFormErrors(errors)}
            graderSelections={editedThesis.graders}
            setGraderSelections={(newGraders) =>
              setEditedThesis((oldThesis) => ({
                ...oldThesis,
                graders: newGraders,
              }))
            }
            disabledMode={false}
            maxGraders={Number(maxGraders)}
          />

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

            <FileDropzone
              id="researchPlan"
              label={t('thesisForm:uploadResearchPlan')}
              required
              error={formErrors.some(
                (error) => error.path[0] === 'researchPlan'
              )}
              helperText={t(
                formErrors.find((error) => error.path[0] === 'researchPlan')
                  ?.message
              )}
              uploadedFile={editedThesis?.researchPlan}
              handleFileUpload={(files) => {
                setEditedThesis((oldThesis) => ({
                  ...oldThesis,
                  researchPlan: files[0],
                }))

                setFormErrors(
                  formErrors.filter((error) => error.path[0] !== 'researchPlan')
                )
              }}
              inputProps={{
                'data-testid': 'research-plan-input',
                accept: '.pdf',
                type: 'file',
              }}
            />

            {editedThesis.researchPlan && (
              <FilePreview
                file={editedThesis.researchPlan}
                onDelete={() => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    researchPlan: undefined,
                  }))
                }}
              />
            )}

            <FileDropzone
              id="waysOfWorking"
              label={t('thesisForm:uploadWaysOfWorking')}
              required={Boolean(
                selectedProgram?.options?.waysOfWorkingRequired
              )}
              error={formErrors.some(
                (error) => error.path[0] === 'waysOfWorking'
              )}
              helperText={t('thesisForm:waysOfWorkingHelperText')}
              uploadedFile={editedThesis?.waysOfWorking}
              handleFileUpload={(files) => {
                setEditedThesis((oldThesis) => ({
                  ...oldThesis,
                  waysOfWorking: files[0],
                }))

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
            {editedThesis.waysOfWorking && (
              <FilePreview
                file={editedThesis.waysOfWorking}
                onDelete={() =>
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    waysOfWorking: undefined,
                    waysOfWorkingValidUntil: null,
                  }))
                }
              />
            )}

            {(Boolean(selectedProgram?.options?.waysOfWorkingRequired) ||
              Boolean(editedThesis.waysOfWorking)) && (
              <DatePicker
                label={`${t('thesisForm:waysOfWorkingValidUntil')}*`}
                slotProps={{
                  textField: {
                    id: 'waysOfWorkingValidUntil',
                    helperText:
                      t(
                        formErrors.find(
                          (error) => error.path[0] === 'waysOfWorkingValidUntil'
                        )?.message
                      ) || 'DD.MM.YYYY',
                    fullWidth: true,
                    error: formErrors.some(
                      (error) => error.path[0] === 'waysOfWorkingValidUntil'
                    ),
                  },
                }}
                name="waysOfWorkingValidUntil"
                value={
                  editedThesis.waysOfWorkingValidUntil
                    ? dayjs(editedThesis.waysOfWorkingValidUntil)
                    : null
                }
                format="DD.MM.YYYY"
                onChange={(date) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    waysOfWorkingValidUntil: date
                      ? date.format('YYYY-MM-DD')
                      : null,
                  }))

                  setFormErrors(
                    formErrors.filter(
                      (error) => error.path[0] !== 'waysOfWorkingValidUntil'
                    )
                  )
                }}
              />
            )}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          onClick={() => {
            clearURL()
            onClose()
          }}
        >
          {t('cancelButton')}
        </Button>
        <Button
          data-testid="submit-button"
          type="button"
          variant="contained"
          sx={{ borderRadius: '0.5rem' }}
          onClick={handleSubmit}
        >
          {t('submitButton')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ThesisEditForm
