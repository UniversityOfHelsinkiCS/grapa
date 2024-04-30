import { ThesisData } from '@backend/types'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import programs from './mockPorgrams'

const ThesisEditForm: React.FC<{
  initialThesis: ThesisData
  onClose: () => void
  onSubmit: (data: ThesisData) => Promise<void>
}> = ({ initialThesis, onSubmit, onClose }) => {
  const { t } = useTranslation()
  const [editedTesis, setEditedThesis] = useState<ThesisData | null>(
    initialThesis
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
          const formData = new FormData(event.currentTarget)
          const formJson = Object.fromEntries(
            (formData as any).entries()
          ) as ThesisData

          await onSubmit(formJson)
        },
      }}
    >
      <DialogTitle>{t('editThesisDialog')}</DialogTitle>
      <DialogContent>
        <Stack spacing={6}>
          <TextField
            autoFocus
            required
            margin="dense"
            id="topic"
            name="topic"
            label={t('topicHeader')}
            value={editedTesis.topic}
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
              value={editedTesis.programId}
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
            <InputLabel id="status-select-label">
              {t('statusHeader')}
            </InputLabel>
            <Select
              value={editedTesis.status}
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
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label={t('startDateHeader')}
              name="startDate"
              value={dayjs(editedTesis.startDate)}
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
              value={dayjs(editedTesis.targetDate)}
              onChange={(date) => {
                setEditedThesis((oldThesis) => ({
                  ...oldThesis,
                  targetDate: date.format('YYYY-MM-DD'),
                }))
              }}
            />
          </LocalizationProvider>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('cancelButton')}</Button>
        <Button type="submit">{t('submitButton')}</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ThesisEditForm
