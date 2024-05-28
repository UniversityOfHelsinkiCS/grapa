import { ThesisData } from '@backend/types'
import { styled } from '@mui/material/styles'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import UploadFileIcon from '@mui/icons-material/UploadFile'
import ErrorIcon from '@mui/icons-material/Error'
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { useState } from 'react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import programs from '../mockPorgrams'
import SupervisorSelect from './SupervisorSelect'
import useUsers from '../../hooks/useUsers'
import { BASE_PATH } from '../../../config'

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
  const { t } = useTranslation()
  const [editedThesis, setEditedThesis] = useState<ThesisData | null>(
    initialThesis
  )
  const { users } = useUsers()

  const authorIds = editedThesis.authors.map((author) => author.userId)
  const supervisorIds = editedThesis.supervisions.map(
    (supervision) => supervision.userId
  )

  if (!users) {
    return (
      <Dialog fullWidth maxWidth="lg" open onClose={onClose}>
        <DialogTitle>{t('thesisForm:editThesisDialog')}</DialogTitle>
        <DialogContent>
          <Stack spacing={6} alignItems="center" height={300}>
            <CircularProgress />
          </Stack>
        </DialogContent>
      </Dialog>
    )
  }

  // authors cannot be supervisors
  const potentialAuthors = users.filter(
    (user) => !supervisorIds.includes(user.id)
  )
  // supervisors cannot be authors
  const potentialSupervisors = users.filter(
    (user) => !authorIds.includes(user.id)
  )

  const getTotalPercentage = () =>
    editedThesis.supervisions.reduce(
      (total, selection) => total + selection.percentage,
      0
    )
  const totalPercentage = getTotalPercentage()

  const canSubmit = Boolean(
    editedThesis?.topic &&
      editedThesis?.programId &&
      editedThesis?.authors.length &&
      editedThesis?.supervisions.length &&
      totalPercentage === 100 &&
      editedThesis?.status &&
      editedThesis?.startDate &&
      editedThesis?.targetDate &&
      editedThesis?.startDate < editedThesis?.targetDate &&
      editedThesis?.researchPlan &&
      editedThesis?.waysOfWorking
  )

  return (
    <Dialog
      open
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      PaperProps={{
        component: 'form',
        onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
          event.preventDefault()

          await onSubmit(editedThesis)
        },
      }}
    >
      <DialogTitle>{t('thesisForm:editThesisDialog')}</DialogTitle>
      <DialogContent>
        <Stack spacing={6}>
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
            variant="standard"
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
            <InputLabel id="author-select-label">{t('author')}</InputLabel>
            <Select
              required
              value={
                editedThesis.authors.length > 0
                  ? editedThesis.authors[0].userId
                  : ''
              }
              label="Author"
              name="author"
              onChange={(event) => {
                setEditedThesis((oldThesis) => ({
                  ...oldThesis,
                  authors: [{ userId: event.target.value }],
                }))
              }}
            >
              {potentialAuthors.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username}
                </MenuItem>
              ))}
            </Select>
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
          <LocalizationProvider adapterLocale="fiFI" dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t('startDateHeader')}
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
            <DatePicker
              label={t('targetDateHeader')}
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
          </LocalizationProvider>

          <SupervisorSelect
            supervisorSelections={editedThesis.supervisions}
            setSupervisorSelections={(newSupervisions) =>
              setEditedThesis((oldThesis) => ({
                ...oldThesis,
                supervisions: newSupervisions,
              }))
            }
            supervisors={potentialSupervisors}
          />
        </Stack>
        <Stack spacing={1}>
          {totalPercentage !== 100 && (
            <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
              {t('thesisForm:supervisionPercentageError')}
            </Alert>
          )}
          {!editedThesis?.authors.length && (
            <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
              {t('thesisForm:authorMissingError')}
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
        <Button onClick={onClose}>{t('cancelButton')}</Button>
        <Button disabled={!canSubmit} type="submit">
          {t('submitButton')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default ThesisEditForm
