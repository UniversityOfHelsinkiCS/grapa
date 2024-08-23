import * as React from 'react'
import { useState } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/fi'
import { sortBy } from 'lodash-es'

import { User, ThesisData, TranslationLanguage } from '@backend/types'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import BookmarkIcon from '@mui/icons-material/Bookmark'
import {
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  Link,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import SupervisorSelect from './SupervisorSelect/SupervisorSelect'
import useUsers from '../../hooks/useUsers'
import { BASE_PATH } from '../../../config'
import { useDebounce } from '../../hooks/useDebounce'
import useLoggedInUser from '../../hooks/useLoggedInUser'
import { getFormErrors, getSortedPrograms } from './util'
import GraderSelect from './GraderSelect/GraderSelect'
import ErrorSummary from '../Common/ErrorSummary'
import { ProgramData as Program } from '../../../server/types'
import FileDropzone from './Dropzone'

const ThesisEditForm: React.FC<{
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
    const thesisErrors = getFormErrors(editedThesis)

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

  const selectedProgram = programs.find(
    (program) => program.id === editedThesis.programId
  )

  const favoritePrograms = programs.filter((program) => program.isFavorite)
  const otherPrograms = programs.filter((program) => !program.isFavorite)

  const sortedFavoritePrograms = getSortedPrograms(favoritePrograms, language)
  const sortedOtherPrograms = getSortedPrograms(otherPrograms, language)

  const sortedStudyTracks =
    selectedProgram && selectedProgram.studyTracks?.length
      ? sortBy(
          selectedProgram.studyTracks,
          (studyTrack) => studyTrack.name[language]
        )
      : []

  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={handleClose}
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
      }}
    >
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
                {t('programHeader')}
              </InputLabel>
              <Select
                data-testid="program-select-input"
                required
                value={editedThesis.programId}
                id="programId"
                label="Program"
                name="programId"
                onChange={(event) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    programId: event.target.value as ThesisData['programId'],
                    studyTrackId: programs.find(
                      (program) => program.id === event.target.value
                    )?.studyTracks?.[0]?.id,
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
                {sortedFavoritePrograms.map((program) => (
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
                {sortedOtherPrograms.map((program) => (
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
                  value={editedThesis.studyTrackId}
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
                  {sortedStudyTracks.map((studyTrack) => (
                    <MenuItem key={studyTrack.id} value={studyTrack.id}>
                      {studyTrack.name[language]}
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
            )}

            <FormControl fullWidth>
              <Autocomplete<User>
                id="authors"
                noOptionsText={t('userSearchNoOptions')}
                data-testid="author-select-input"
                disablePortal
                options={authorOptions ?? []}
                getOptionLabel={(author) =>
                  `${author.firstName} ${author.lastName} ${author.email ? `(${author.email})` : ''} ${author.studentNumber ? `(${author.studentNumber})` : ''}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('author')}
                    required
                    error={formErrors.some(
                      (error) => error.path[0] === 'authors'
                    )}
                    helperText={t(
                      formErrors.find((error) => error.path[0] === 'authors')
                        ?.message
                    )}
                  />
                )}
                inputValue={userSearch}
                filterOptions={(x) => x}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={
                  editedThesis.authors.length > 0
                    ? editedThesis.authors[0]
                    : null
                }
                onChange={(_, value) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    authors: [value],
                  }))

                  setFormErrors(
                    formErrors.filter((error) => error.path[0] !== 'authors')
                  )
                }}
                onInputChange={(event, value) => {
                  // Fetch potential authors based on the input value
                  // You can use debounce or throttle to limit the number of requests
                  // Example: fetchPotentialAuthors(value)
                  setUserSearch(value)
                }}
              />
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="status-select-label">
                {t('statusHeader')}
              </InputLabel>
              <Select
                data-testid="status-select-input"
                required
                disabled={
                  editedThesis.status === 'PLANNING' &&
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
                <MenuItem value="PLANNING">
                  {t('thesisStages:planned')}
                </MenuItem>
                <MenuItem value="IN_PROGRESS">
                  {t('thesisStages:inProgress')}
                </MenuItem>
                <MenuItem value="COMPLETED">
                  {t('thesisStages:completed')}
                </MenuItem>
                <MenuItem value="CANCELLED">
                  {t('thesisStages:cancelled')}
                </MenuItem>
              </Select>
              <FormHelperText error>
                {t(
                  formErrors.find((error) => error.path[0] === 'status')
                    ?.message
                )}
              </FormHelperText>
            </FormControl>

            <LocalizationProvider
              adapterLocale={language}
              dateAdapter={AdapterDayjs}
            >
              <Grid container rowSpacing={{ xs: 2, md: 0 }}>
                <Grid item xs={12} md={6} sx={{ pr: { md: '1rem' } }}>
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
                <Grid item xs={12} md={6} sx={{ pl: { md: '1rem' } }}>
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
            </LocalizationProvider>
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
          />

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
              <Chip
                label={
                  'filename' in editedThesis.researchPlan ? (
                    <Link
                      href={`${BASE_PATH}/api/attachments/${editedThesis.researchPlan.filename}`}
                    >
                      {editedThesis.researchPlan.name}
                    </Link>
                  ) : (
                    editedThesis.researchPlan.name
                  )
                }
                icon={<UploadFileIcon />}
                variant="outlined"
                sx={{ maxWidth: 200 }}
                onDelete={() =>
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    researchPlan: undefined,
                  }))
                }
              />
            )}

            <FileDropzone
              id="waysOfWorking"
              label={t('thesisForm:uploadWaysOfWorking')}
              error={formErrors.some(
                (error) => error.path[0] === 'waysOfWorking'
              )}
              helperText={t(
                formErrors.find((error) => error.path[0] === 'waysOfWorking')
                  ?.message
              )}
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
              <Chip
                label={
                  'filename' in editedThesis.waysOfWorking ? (
                    <Link
                      href={`${BASE_PATH}/api/attachments/${editedThesis.waysOfWorking.filename}`}
                    >
                      {editedThesis.waysOfWorking.name}
                    </Link>
                  ) : (
                    editedThesis.waysOfWorking.name
                  )
                }
                icon={<UploadFileIcon />}
                variant="outlined"
                sx={{ maxWidth: 200 }}
                onDelete={() =>
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    waysOfWorking: undefined,
                  }))
                }
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
