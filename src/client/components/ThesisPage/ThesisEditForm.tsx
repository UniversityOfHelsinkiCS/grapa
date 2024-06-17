import { AuthorData, ThesisData } from '@backend/types'
import { styled } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
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
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import 'dayjs/locale/fi'
import { useState } from 'react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { ZodIssue } from 'zod'
import programs from '../mockPorgrams'
import SupervisorSelect from './SupervisorSelect/SupervisorSelect'
import useUsers from '../../hooks/useUsers'
import { BASE_PATH } from '../../../config'
import { useDebounce } from '../../hooks/useDebounce'
import { getFormErrors } from './util'
import GraderSelect from './GraderSelect/GraderSelect'
import ErrorSummary from '../Common/ErrorSummary'

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
})

const ThesisEditForm: React.FC<{
  formTitle: string
  initialThesis: ThesisData
  onClose: () => void
  onSubmit: (data: ThesisData) => Promise<void>
}> = ({ formTitle, initialThesis, onSubmit, onClose }) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n

  const [formErrors, setFormErrors] = useState<ZodIssue[]>([])
  const [editedThesis, setEditedThesis] = useState<ThesisData | null>(
    initialThesis
  )
  const [userSearch, setUserSearch] = useState('')

  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers(debouncedSearch)

  const handleSubmit = async () => {
    const thesisErrors = getFormErrors(editedThesis)

    if (thesisErrors.length > 0) {
      setFormErrors(thesisErrors)
      return
    }

    await onSubmit(editedThesis)
    setFormErrors([])
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={onClose}
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
              <li key={`error-${error.path.join('-')}`}>
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
              }}
              error={formErrors.some((error) => error.path[0] === 'topic')}
              helperText={
                formErrors.find((error) => error.path[0] === 'topic')?.message
              }
              fullWidth
              variant="outlined"
            />

            <FormControl fullWidth>
              <InputLabel id="program-select-label">
                {t('programHeader')}
              </InputLabel>
              <Select
                required
                value={editedThesis.programId}
                id="programId"
                label="Program"
                name="programId"
                onChange={(event) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    programId: event.target.value as ThesisData['programId'],
                  }))
                }}
                error={formErrors.some(
                  (error) => error.path[0] === 'programId'
                )}
              >
                {programs.map((program) => (
                  <MenuItem key={program.key} value={program.key}>
                    {program.name.en}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText error>
                {
                  formErrors.find((error) => error.path[0] === 'programId')
                    ?.message
                }
              </FormHelperText>
            </FormControl>

            <FormControl fullWidth>
              <Autocomplete<AuthorData>
                id="authors"
                data-testid="author-select-input"
                disablePortal
                options={users ?? []}
                getOptionLabel={(user) =>
                  `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''} ${user.username ? `(${user.username})` : ''}`
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('author')}
                    required
                    error={formErrors.some(
                      (error) => error.path[0] === 'authors'
                    )}
                    helperText={
                      formErrors.find((error) => error.path[0] === 'authors')
                        ?.message
                    }
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
                required
                value={editedThesis.status}
                label={t('statusHeader')}
                id="status"
                name="status"
                onChange={(event) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    status: event.target.value as ThesisData['status'],
                  }))
                }}
                error={formErrors.some((error) => error.path[0] === 'status')}
              >
                <MenuItem value="PLANNING">Planning</MenuItem>
                <MenuItem value="STARTED">Started</MenuItem>
                <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
              <FormHelperText error>
                {
                  formErrors.find((error) => error.path[0] === 'status')
                    ?.message
                }
              </FormHelperText>
            </FormControl>

            <LocalizationProvider
              adapterLocale={language}
              dateAdapter={AdapterDayjs}
            >
              <Grid container>
                <Grid item xs={6} sx={{ pr: '1rem' }}>
                  <DatePicker
                    label={t('startDateHeader')}
                    slotProps={{
                      textField: {
                        id: 'startDate',
                        helperText:
                          formErrors.find(
                            (error) => error.path[0] === 'startDate'
                          )?.message || 'MM.DD.YYYY',
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
                    }}
                  />
                </Grid>
                <Grid item xs={6} sx={{ pl: '1rem' }}>
                  <DatePicker
                    label={t('targetDateHeader')}
                    slotProps={{
                      textField: {
                        id: 'targetDate',
                        helperText:
                          formErrors.find(
                            (error) => error.path[0] === 'targetDate'
                          )?.message || 'MM.DD.YYYY',
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
                    }}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Stack>

          <SupervisorSelect
            errors={formErrors.filter(
              (error) => error.path[0] === 'supervisions'
            )}
            supervisorSelections={editedThesis.supervisions}
            setSupervisorSelections={(newSupervisions) =>
              setEditedThesis((oldThesis) => ({
                ...oldThesis,
                supervisions: newSupervisions,
              }))
            }
          />

          <GraderSelect
            errors={formErrors.filter((error) => error.path[0] === 'graders')}
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
            <Button
              id="researchPlan"
              component="label"
              variant="contained"
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
            >
              {t('thesisForm:uploadResearchPlanButton')}
              <VisuallyHiddenInput
                value=""
                onChange={(ev) =>
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    researchPlan: ev.target.files[0],
                  }))
                }
                type="file"
                accept=".pdf"
              />
            </Button>
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
            <Button
              id="waysOfWorking"
              component="label"
              variant="contained"
              tabIndex={-1}
              startIcon={<CloudUploadIcon />}
            >
              {t('thesisForm:uploadWaysOfWorkingButton')}
              <VisuallyHiddenInput
                value=""
                onChange={(ev) =>
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    waysOfWorking: ev.target.files[0],
                  }))
                }
                type="file"
                accept=".pdf"
              />
            </Button>
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
        <Button type="button" onClick={onClose}>
          {t('cancelButton')}
        </Button>
        <Button
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
