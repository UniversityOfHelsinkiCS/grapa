import { AuthorData, ThesisData } from '@backend/types'
import { styled } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import ErrorIcon from '@mui/icons-material/Error'
import {
  Alert,
  Autocomplete,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
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
import programs from '../mockPorgrams'
import SupervisorSelect from './SupervisorSelect/SupervisorSelect'
import useUsers from '../../hooks/useUsers'
import { BASE_PATH } from '../../../config'
import { useDebounce } from '../../hooks/useDebounce'
import { getTotalPercentage } from './util'
import GraderSelect from './GraderSelect/GraderSelect'

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
  initialThesis: ThesisData
  onClose: () => void
  onSubmit: (data: ThesisData) => Promise<void>
}> = ({ initialThesis, onSubmit, onClose }) => {
  const { t, i18n } = useTranslation()
  const { language } = i18n

  const [editedThesis, setEditedThesis] = useState<ThesisData | null>(
    initialThesis
  )
  const [userSearch, setUserSearch] = useState('')

  const debouncedSearch = useDebounce(userSearch, 700)
  const { users } = useUsers(debouncedSearch)

  const totalPercentage = getTotalPercentage(editedThesis)

  const canSubmit = Boolean(
    editedThesis?.supervisions.length &&
      totalPercentage === 100 &&
      editedThesis?.graders[0] &&
      editedThesis?.topic &&
      editedThesis?.status &&
      editedThesis?.startDate &&
      editedThesis?.targetDate &&
      editedThesis?.startDate < editedThesis?.targetDate &&
      editedThesis?.researchPlan &&
      editedThesis?.waysOfWorking
  )

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    await onSubmit(editedThesis)
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
      <DialogTitle component="h1">
        {t('thesisForm:editThesisDialog')}
      </DialogTitle>
      <DialogContent>
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
                label="Program"
                name="programId"
                onChange={(event) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    programId: event.target.value as ThesisData['programId'],
                  }))
                }}
              >
                {programs.map((program) => (
                  <MenuItem key={program.key} value={program.key}>
                    {program.name.en}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <Autocomplete<AuthorData>
                disablePortal
                options={users ?? []}
                getOptionLabel={(user) =>
                  `${user.firstName} ${user.lastName} ${user.email ? `(${user.email})` : ''} ${user.username ? `(${user.username})` : ''}`
                }
                renderInput={(params) => (
                  <TextField {...params} label={t('author')} required />
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
                name="status"
                onChange={(event) => {
                  setEditedThesis((oldThesis) => ({
                    ...oldThesis,
                    status: event.target.value as ThesisData['status'],
                  }))
                }}
              >
                <MenuItem value="PLANNING">Planning</MenuItem>
                <MenuItem value="STARTED">Started</MenuItem>
                <MenuItem value="IN_PROGRESS">In progress</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </Select>
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
                        helperText: 'MM.DD.YYYY',
                        fullWidth: true,
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
                        helperText: 'MM.DD.YYYY',
                        fullWidth: true,
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
            supervisorSelections={editedThesis.supervisions}
            setSupervisorSelections={(newSupervisions) =>
              setEditedThesis((oldThesis) => ({
                ...oldThesis,
                supervisions: newSupervisions,
              }))
            }
          />

          <GraderSelect
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
        <Stack spacing={1} sx={{ mt: '2rem' }}>
          {totalPercentage !== 100 && (
            <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
              {t('thesisForm:supervisionPercentageError')}
            </Alert>
          )}
          {!editedThesis.researchPlan && (
            <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
              {t('thesisForm:researchPlanMissingError')}
            </Alert>
          )}
          {!editedThesis.waysOfWorking && (
            <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
              {t('thesisForm:waysOfWorkingMissingError')}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          variant="contained"
          color="error"
          sx={{ borderRadius: '0.5rem' }}
          onClick={onClose}
        >
          {t('cancelButton')}
        </Button>
        <Button type="submit">{t('submitButton')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ThesisEditForm
